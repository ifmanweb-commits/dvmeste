'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { writeFile, mkdir, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';

const CERTIFICATES_DIR = join(process.cwd(), 'public', 'images', 'certificates-tmpl');
const FONT_PATH = join(process.cwd(), 'private', 'PT-Serif', 'PT_Serif-Web-Regular.ttf');
const PREVIEW_DIR = join(process.cwd(), 'public', 'certificates');

// Проверка прав доступа (админ или менеджер)
async function checkAdminOrManagerAccess() {
  // В реальной реализации здесь будет проверка сессии
  // Пока возвращаем true для разработки
  return true;
}

// Получить список всех шаблонов
export async function getCertificateTemplates() {
  await checkAdminOrManagerAccess();
  
  const templates = await prisma.certificateTemplate.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { certificates: true }
      }
    }
  });
  
  return templates;
}

// Получить шаблон по ID
export async function getCertificateTemplateById(id: string) {
  await checkAdminOrManagerAccess();
  
  const template = await prisma.certificateTemplate.findUnique({
    where: { id },
    include: {
      certificates: {
        take: 5,
        orderBy: { issuedAt: 'desc' }
      }
    }
  });
  
  return template;
}

// Создать шаблон
export async function createCertificateTemplate(formData: FormData) {
  await checkAdminOrManagerAccess();
  
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const isActive = formData.get('isActive') === 'on';
  const backgroundFile = formData.get('background') as File;
  
  if (!name || !slug) {
    return { error: 'Название и slug обязательны' };
  }
  
  // Проверка уникальности slug
  const existing = await prisma.certificateTemplate.findUnique({ where: { slug } });
  if (existing) {
    return { error: 'Шаблон с таким slug уже существует' };
  }
  
  let backgroundUrl = '';
  let fieldsJson: any = { fields: [], background: { width: 0, height: 0 } };
  
  if (backgroundFile && backgroundFile.size > 0) {
    // Сохраняем файл
    const bytes = await backgroundFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Создаём уникальное имя файла
    const filename = `${Date.now()}-${slug}-background.png`;
    const filepath = join(CERTIFICATES_DIR, filename);
    
    // Создаём директорию если не существует
    await mkdir(CERTIFICATES_DIR, { recursive: true });
    
    // Обработка изображения через sharp для получения размеров и сохранения
    const metadata = await sharp(buffer).metadata();
    const originalWidth = metadata.width || 0;
    const originalHeight = metadata.height || 0;
    
    // Сохраняем оригинал
    await sharp(buffer).toFile(filepath);
    
    backgroundUrl = `/images/certificates-tmpl/${filename}`;
    fieldsJson = {
      fields: [],
      background: {
        width: originalWidth,
        height: originalHeight,
        previewWidth: Math.min(originalWidth, 1920),
        previewHeight: Math.round(originalHeight * (Math.min(originalWidth, 1920) / originalWidth))
      }
    };
  }
  
  const template = await prisma.certificateTemplate.create({
    data: {
      name,
      slug,
      backgroundUrl,
      fieldsJson,
      isActive
    }
  });
  
  revalidatePath('/admin/certificate-templates');
  return { success: true, template };
}

// Обновить шаблон
export async function updateCertificateTemplate(id: string, formData: FormData) {
  await checkAdminOrManagerAccess();
  
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const isActive = formData.get('isActive') === 'on';
  const backgroundFile = formData.get('background') as File;
  
  if (!name || !slug) {
    return { error: 'Название и slug обязательны' };
  }
  
  const existing = await prisma.certificateTemplate.findUnique({ where: { id } });
  if (!existing) {
    return { error: 'Шаблон не найден' };
  }
  
  // Проверка уникальности slug (если slug изменился)
  if (slug !== existing.slug) {
    const slugExists = await prisma.certificateTemplate.findUnique({ where: { slug } });
    if (slugExists && slugExists.id !== id) {
      return { error: 'Шаблон с таким slug уже существует' };
    }
  }
  
  let updateData: any = { name, slug, isActive };
  
  if (backgroundFile && backgroundFile.size > 0) {
    // Удаляем старый файл если есть
    if (existing.backgroundUrl) {
      const oldPath = join(process.cwd(), 'public', existing.backgroundUrl);
      try {
        await unlink(oldPath);
      } catch (e) {
        console.error('Ошибка удаления старого файла:', e);
      }
    }
    
    // Сохраняем новый файл
    const bytes = await backgroundFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const filename = `${Date.now()}-${slug}-background.png`;
    const filepath = join(CERTIFICATES_DIR, filename);
    
    await mkdir(CERTIFICATES_DIR, { recursive: true });
    
    const metadata = await sharp(buffer).metadata();
    const originalWidth = metadata.width || 0;
    const originalHeight = metadata.height || 0;
    
    await sharp(buffer).toFile(filepath);
    
    updateData.backgroundUrl = `/images/certificates-tmpl/${filename}`;
    // Сохраняем существующие поля, но обновляем размеры фона
    const currentFields = (existing.fieldsJson as any)?.fields || [];
    updateData.fieldsJson = {
      fields: currentFields,
      background: {
        width: originalWidth,
        height: originalHeight,
        previewWidth: Math.min(originalWidth, 1920),
        previewHeight: Math.round(originalHeight * (Math.min(originalWidth, 1920) / originalWidth))
      }
    };
  }
  
  const template = await prisma.certificateTemplate.update({
    where: { id },
    data: updateData
  });
  
  revalidatePath('/admin/certificate-templates');
  return { success: true, template };
}

// Удалить шаблон
export async function deleteCertificateTemplate(id: string) {
  await checkAdminOrManagerAccess();
  
  const template = await prisma.certificateTemplate.findUnique({ where: { id } });
  if (!template) {
    return { error: 'Шаблон не найден' };
  }
  
  // Удаляем файл фона
  if (template.backgroundUrl) {
    const filepath = join(process.cwd(), 'public', template.backgroundUrl);
    try {
      await unlink(filepath);
    } catch (e) {
      console.error('Ошибка удаления файла фона:', e);
    }
  }
  
  await prisma.certificateTemplate.delete({ where: { id } });
  
  revalidatePath('/admin/certificate-templates');
  return { success: true };
}

// Обновить поля шаблона (fieldsJson)
export async function updateTemplateFields(id: string, fieldsJson: any) {
  await checkAdminOrManagerAccess();
  
  const template = await prisma.certificateTemplate.update({
    where: { id },
    data: { fieldsJson }
  });
  
  return { success: true, template };
}

// Сгенерировать превью сертификата (возвращает base64 PNG)
export async function generateCertificatePreview(templateId: string, fieldValues: Record<string, string>) {
  await checkAdminOrManagerAccess();
  
  const template = await prisma.certificateTemplate.findUnique({ where: { id: templateId } });
  if (!template) {
    return { error: 'Шаблон не найден' };
  }
  
  if (!template.backgroundUrl) {
    return { error: 'Фон шаблона не загружен' };
  }
  
  try {
    // Читаем фоновое изображение
    const bgPath = join(process.cwd(), 'public', template.backgroundUrl);
    const background = await readFile(bgPath);
    
    // Создаём sharp изображение
    const image = sharp(background);
    const metadata = await image.metadata();
    const width = metadata.width || 1200;
    const height = metadata.height || 800;
    
    // Получаем поля из fieldsJson
    const fieldsConfig = (template.fieldsJson as any)?.fields || [];
    
    // Создаём SVG с текстом для наложения
    const svgOverlays = fieldsConfig
      .filter((field: any) => fieldValues[field.name])
      .map((field: any) => {
        const value = fieldValues[field.name];
        const x = (field.xPercent / 100) * width;
        const y = (field.yPercent / 100) * height;
        const fontSize = field.fontSize || 24;
        const fontColor = field.fontColor || '#333333';
        const fontFamily = field.fontFamily || 'PT Serif';
        const textAlign = field.textAlign || 'center';
        
        let textAnchor = 'start';
        let textX = x;
        
        if (textAlign === 'center') {
          textAnchor = 'middle';
          textX = x;
        } else if (textAlign === 'right') {
          textAnchor = 'end';
          textX = x;
        }
        
        return `
          <text
            x="${textX}"
            y="${y}"
            font-size="${fontSize}"
            fill="${fontColor}"
            font-family="${fontFamily}"
            text-anchor="${textAnchor}"
          >${escapeXml(value)}</text>
        `;
      })
      .join('');
    
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <style>
          @font-face {
            font-family: "PT Serif";
            src: url("file://${FONT_PATH}");
          }
        </style>
        ${svgOverlays}
      </svg>
    `;
    
    // Накладываем SVG на изображение
    const result = await image
      .composite([{
        input: Buffer.from(svg),
        top: 0,
        left: 0
      }])
      .png()
      .toBuffer();
    
    // Конвертируем в base64
    const base64 = result.toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;
    
    return { success: true, dataUrl, width, height };
  } catch (error) {
    console.error('Ошибка генерации превью:', error);
    return { error: 'Ошибка генерации превью: ' + (error as Error).message };
  }
}

// Экранирование XML специальных символов
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '\u0026amp;')
    .replace(/</g, '\u003Clt;')
    .replace(/>/g, '\u003Egt;')
    .replace(/"/g, '\u0022quot;')
    .replace(/'/g, '\u0027apos;');
}

// Сгенерировать сертификат и сохранить (для выдачи пользователю)
export async function generateAndSaveCertificate(
  templateId: string,
  userId: string,
  fieldValues: Record<string, string>
) {
  await checkAdminOrManagerAccess();
  
  const template = await prisma.certificateTemplate.findUnique({ where: { id: templateId } });
  if (!template) {
    return { error: 'Шаблон не найден' };
  }
  
  if (!template.backgroundUrl) {
    return { error: 'Фон шаблона не загружен' };
  }
  
  try {
    // Читаем фоновое изображение
    const bgPath = join(process.cwd(), 'public', template.backgroundUrl);
    const background = await readFile(bgPath);
    
    const image = sharp(background);
    const metadata = await image.metadata();
    const width = metadata.width || 1200;
    const height = metadata.height || 800;
    
    const fieldsConfig = (template.fieldsJson as any)?.fields || [];
    
    const svgOverlays = fieldsConfig
      .filter((field: any) => fieldValues[field.name])
      .map((field: any) => {
        const value = fieldValues[field.name];
        const x = (field.xPercent / 100) * width;
        const y = (field.yPercent / 100) * height;
        const fontSize = field.fontSize || 24;
        const fontColor = field.fontColor || '#333333';
        const fontFamily = field.fontFamily || 'PT Serif';
        const textAlign = field.textAlign || 'center';
        
        let textAnchor = 'start';
        let textX = x;
        
        if (textAlign === 'center') {
          textAnchor = 'middle';
          textX = x;
        } else if (textAlign === 'right') {
          textAnchor = 'end';
          textX = x;
        }
        
        return `
          <text
            x="${textX}"
            y="${y}"
            font-size="${fontSize}"
            fill="${fontColor}"
            font-family="${fontFamily}"
            text-anchor="${textAnchor}"
          >${escapeXml(value)}</text>
        `;
      })
      .join('');
    
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <style>
          @font-face {
            font-family: "PT Serif";
            src: url("file://${FONT_PATH}");
          }
        </style>
        ${svgOverlays}
      </svg>
    `;
    
    const result = await image
      .composite([{
        input: Buffer.from(svg),
        top: 0,
        left: 0
      }])
      .png()
      .toBuffer();
    
    // Сохраняем в public/certificates
    await mkdir(PREVIEW_DIR, { recursive: true });
    const filename = `cert-${Date.now()}-${userId}.png`;
    const filepath = join(PREVIEW_DIR, filename);
    await writeFile(filepath, result);
    
    const imageUrl = `/certificates/${filename}`;
    
    // Создаём запись в БД
    const certificate = await prisma.certificate.create({
      data: {
        templateId,
        userId,
        dataJson: fieldValues,
        imageUrl
      }
    });
    
    return { success: true, certificate, imageUrl };
  } catch (error) {
    console.error('Ошибка генерации сертификата:', error);
    return { error: 'Ошибка генерации сертификата: ' + (error as Error).message };
  }
}