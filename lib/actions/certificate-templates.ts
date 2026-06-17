'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { writeFile, mkdir, readFile, unlink, access } from 'fs/promises';
import { join } from 'path';
import { createCanvas, loadImage, registerFont } from 'canvas';
import { getCurrentUser } from '@/lib/auth/session';

const CERTIFICATES_DIR = join(process.cwd(), 'public', 'images', 'certificates-tmpl');
const FONT_REGULAR_PATH = join(process.cwd(), 'private', 'PT-Serif', 'PT_Serif-Web-Regular.ttf');
const FONT_BOLD_PATH = join(process.cwd(), 'private', 'PT-Serif', 'PT_Serif-Web-Bold.ttf');
const PREVIEW_DIR = join(process.cwd(), 'public', 'certificates');

// Проверка прав доступа (админ или менеджер)
async function checkAdminOrManagerAccess() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Требуется авторизация');
  }
  
  // Проверяем, является ли пользователь админом или менеджером
  if (!user.isAdmin && !user.isManager && !user.isSuperAdmin) {
    throw new Error('Требуется роль администратора или менеджера');
  }
}

// Зарегистрировать шрифты (вызывается внутри функций генерации)
async function ensureFontsRegistered() {
  try {
    // Проверяем существование файлов
    await access(FONT_REGULAR_PATH);
    await access(FONT_BOLD_PATH);
    
    // Регистрируем шрифты с разными именами семейств для корректного использования
    registerFont(FONT_REGULAR_PATH, { family: 'PT Serif' });
    registerFont(FONT_BOLD_PATH, { family: 'PT Serif Bold' });
    
    console.log('Шрифты успешно зарегистрированы:', FONT_REGULAR_PATH, FONT_BOLD_PATH);
  } catch (error) {
    console.error('Ошибка регистрации шрифтов:', error);
    console.error('Пути к шрифтам:', FONT_REGULAR_PATH, FONT_BOLD_PATH);
    console.error('process.cwd():', process.cwd());
    throw new Error('Не удалось загрузить шрифты PT Serif');
  }
}

// Внутренняя функция генерации сертификата (без проверки доступа)
// Используется внутри check-certification-completion.ts и скриптов
async function generateCertificateInternal(
  templateId: string,
  userId: string,
  certificationData: {
    certification: {
      title: string;
      level: number | null;
    };
    award: {
      id: string;
      issuedAt: string;
    };
  }
) {
  const template = await prisma.certificateTemplate.findUnique({ where: { id: templateId } });
  if (!template) {
    return { error: 'Шаблон не найден' };
  }
  
  if (!template.backgroundUrl) {
    return { error: 'Фон шаблона не загружен' };
  }
  
    try {
    // Регистрируем шрифты перед генерацией
    await ensureFontsRegistered();
    
    // Генерируем проверочный код
    const verificationCode = await generateUniqueVerificationCode();
    
    // Добавляем verificationCode в certificationData для resolveVariableValue
    const dataForTemplate = certificationData ? {
      ...certificationData,
      verificationCode,
      award: {
        ...certificationData.award,
        verificationCode,
      }
    } : { verificationCode, award: { verificationCode } };
    
    // Читаем фоновое изображение
    const bgPath = join(process.cwd(), 'public', template.backgroundUrl);
    const backgroundBuffer = await readFile(bgPath);
    
    // Загружаем изображение
    const background = await loadImage(backgroundBuffer);
    const originalWidth = background.width;
    const originalHeight = background.height;
    
    // Определяем наибольшее измерение и ограничиваем до 2339px
    const MAX_SIZE = 2339;
    const maxDimension = Math.max(originalWidth, originalHeight);
    
    // Если ни одно измерение не превышает 2339, оставляем как есть
    let width: number;
    let height: number;
    if (maxDimension <= MAX_SIZE) {
      width = originalWidth;
      height = originalHeight;
    } else {
      // Уменьшаем пропорционально
      const scale = MAX_SIZE / maxDimension;
      width = Math.round(originalWidth * scale);
      height = Math.round(originalHeight * scale);
    }
    
    // Создаём canvas с рассчитанными размерами
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Рисуем фон с масштабированием
    ctx.drawImage(background, 0, 0, width, height);
    
    // Получаем поля из fieldsJson
    const fieldsConfig = (template.fieldsJson as any)?.fields || [];
    
    // Рисуем текст для каждого поля
    for (const field of fieldsConfig) {
      const variable = field.variable as string;
      if (!variable) continue;
      
      // Получаем значение переменной
      let value = await resolveVariableValue(variable, userId, dataForTemplate);
      
      // Форматируем дату если нужно
      if (field.formatDate && variable.includes('issuedAt')) {
        const dateFormat = field.dateFormat || 'DD.MM.YYYY';
        value = formatDateValue(value, dateFormat);
      }
      
      if (!value) continue;
      
      const x = (field.xPercent / 100) * width;
      const y = (field.yPercent / 100) * height;
      const fontSize = field.fontSize || 24;
      const fontColor = field.fontColor || '#333333';
      const fontWeight = field.fontWeight || 'normal';
      const textAlign = field.textAlign || 'center';
      
      // Выбираем шрифт в зависимости от начертания
      const fontFamily = fontWeight === 'bold' ? 'PT Serif Bold' : 'PT Serif';
      
      ctx.font = `${fontWeight === 'bold' ? 'bold' : ''} ${fontSize}px ${fontFamily}`;
      ctx.fillStyle = fontColor;
      ctx.textAlign = textAlign as CanvasTextAlign;
      ctx.textBaseline = 'middle';
      
      ctx.fillText(value, x, y);
    }
    
    // Генерируем уникальное имя файла
    const timestamp = Date.now();
    const filename = `certificate-${template.slug}-${userId}-${timestamp}.png`;
    const outputPath = join(PREVIEW_DIR, filename);
    const imageUrl = `/certificates/${filename}`;
    
    // Сохраняем файл
    await mkdir(PREVIEW_DIR, { recursive: true });
    const buffer = canvas.toBuffer('image/png');
    await writeFile(outputPath, buffer);
    
    // Сохраняем запись в БД
    const certificate = await prisma.certificate.create({
      data: {
        templateId,
        userId,
        dataJson: certificationData,
        imageUrl,
        verificationCode,
      },
    });
    
    return { success: true, certificate };
  } catch (error) {
    console.error('Ошибка генерации сертификата:', error);
    return { error: 'Ошибка при генерации сертификата' };
  }
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
    
    // Получаем размеры изображения через loadImage
    const img = await loadImage(buffer);
    const originalWidth = img.width;
    const originalHeight = img.height;
    
    // Сохраняем оригинал
    await writeFile(filepath, buffer);
    
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
    
    const img = await loadImage(buffer);
    const originalWidth = img.width;
    const originalHeight = img.height;
    
    await writeFile(filepath, buffer);
    
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
// Регистрируем шрифты перед генерацией
    await ensureFontsRegistered();
    
    // Читаем фоновое изображение
    const bgPath = join(process.cwd(), 'public', template.backgroundUrl);
    const backgroundBuffer = await readFile(bgPath);
    
    // Загружаем изображение
    const background = await loadImage(backgroundBuffer);
    const originalWidth = background.width;
    const originalHeight = background.height;
    
    // Определяем наибольшее измерение и ограничиваем до 2339px
    const MAX_SIZE = 2339;
    const maxDimension = Math.max(originalWidth, originalHeight);
    
    // Если ни одно измерение не превышает 2339, оставляем как есть
    let width: number;
    let height: number;
    if (maxDimension <= MAX_SIZE) {
      width = originalWidth;
      height = originalHeight;
    } else {
      // Уменьшаем пропорционально
      const scale = MAX_SIZE / maxDimension;
      width = Math.round(originalWidth * scale);
      height = Math.round(originalHeight * scale);
    }
    
    // Создаём canvas с рассчитанными размерами
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Рисуем фон с масштабированием
    ctx.drawImage(background, 0, 0, width, height);
    
    // Получаем поля из fieldsJson
    const fieldsConfig = (template.fieldsJson as any)?.fields || [];
    
    // Рисуем текст для каждого поля
    fieldsConfig
      .filter((field: any) => fieldValues[field.name])
      .forEach((field: any) => {
        const value = fieldValues[field.name];
        const x = (field.xPercent / 100) * width;
        const y = (field.yPercent / 100) * height;
        const fontSize = field.fontSize || 24;
        const fontColor = field.fontColor || '#333333';
        const fontWeight = field.fontWeight || 'normal';
        const textAlign = field.textAlign || 'center';
        
        // Выбираем шрифт в зависимости от начертания
        const fontFamily = fontWeight === 'bold' ? 'PT Serif Bold' : 'PT Serif';
        
        ctx.font = `${fontSize}px "${fontFamily}"`;
        ctx.fillStyle = fontColor;
        ctx.textAlign = textAlign as CanvasTextAlign;
        ctx.textBaseline = 'middle';
        
        ctx.fillText(value, x, y);
      });
    
    // Конвертируем в base64
    const dataUrl = canvas.toDataURL('image/png');
    
    return { success: true, dataUrl, width, height };
  } catch (error) {
    console.error('Ошибка генерации превью:', error);
    return { error: 'Ошибка генерации превью: ' + (error as Error).message };
  }
}

// Генерация проверочного кода (8 символов: кириллические заглавные буквы кроме З, О и цифры кроме 0, 3)
function generateVerificationCode(): string {
  const chars = 'АБВГДЕЁЖИЙКЛМНПРСТУФХЦЧШЩЪЫЬЭЮЯ12456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Проверка уникальности кода
async function isVerificationCodeUnique(code: string): Promise<boolean> {
  const existing = await prisma.certificate.findUnique({
    where: { verificationCode: code }
  });
  return !existing;
}

// Генерация уникального проверочного кода
async function generateUniqueVerificationCode(): Promise<string> {
  let code = generateVerificationCode();
  let attempts = 0;
  while (!(await isVerificationCodeUnique(code)) && attempts < 10) {
    code = generateVerificationCode();
    attempts++;
  }
  return code;
}

// Маппинг предопределённых переменных к значениям
async function resolveVariableValue(
  variable: string,
  userId: string,
  certificationData?: any
): Promise<string> {
  const prisma = (await import('@/lib/prisma')).prisma;
  
  switch (variable) {
    case 'user.fullName': {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } });
      return user?.fullName || '';
    }
    case 'user.fullFio': {
      const user = await prisma.user.findUnique({ 
        where: { id: userId }, 
        select: { firstName: true, lastName: true, middleName: true } 
      });
      if (!user) return '';
      // Формат: "Фамилия Имя Отчество" (отчество опционально)
      const parts = [user.lastName, user.firstName, user.middleName].filter(Boolean);
      return parts.join(' ');
    }
    case 'user.email': {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
      return user?.email || '';
    }
    case 'certification.name': {
      return certificationData?.certification?.title || '';
    }
    case 'certification.awardText': {
      return certificationData?.certification?.awardText || '';
    }
    case 'certification.level': {
      const level = certificationData?.certification?.level;
      return level !== null && level !== undefined ? String(level) : '';
    }
    case 'award.issuedAt': {
      return certificationData?.award?.issuedAt ? new Date(certificationData.award.issuedAt).toISOString() : '';
    }
    case 'award.id': {
      return certificationData?.award?.id || '';
    }
    case 'award.verificationCode': {
      return certificationData?.verificationCode || '';
    }
    default:
      return '';
  }
}

// Форматирование даты
function formatDateValue(dateString: string, format: string = 'DD.MM.YYYY'): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  switch (format) {
    case 'DD.MM.YYYY': return `${day}.${month}.${year}`;
    case 'DD/MM/YYYY': return `${day}/${month}/${year}`;
    case 'MM.DD.YYYY': return `${month}.${day}.${year}`;
    case 'YYYY-MM-DD': return `${year}-${month}-${day}`;
    case 'DD Month YYYY': {
      const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
      return `${day} ${months[date.getMonth()]} ${year}`;
    }
    default: return `${day}.${month}.${year}`;
  }
}

// Сгенерировать сертификат и сохранить (для выдачи пользователю)
export async function generateAndSaveCertificate(
  templateId: string,
  userId: string,
  customValues: Record<string, string> = {},
  certificationData?: {
    certification: {
      title: string;
      awardText?: string | null;
      level: number | null;
    };
    award: {
      id: string;
      issuedAt: string;
    };
  }
) {
  // Проверка доступа только для серверных действий
  // Для внутреннего использования (скрипты, автоматическая генерация) используется generateCertificateInternal
  const template = await prisma.certificateTemplate.findUnique({ where: { id: templateId } });
  if (!template) {
    return { error: 'Шаблон не найден' };
  }
  
  if (!template.backgroundUrl) {
    return { error: 'Фон шаблона не загружен' };
  }
  
  try {
    // Регистрируем шрифты перед генерацией
    await ensureFontsRegistered();
    
    // Генерируем проверочный код
    const verificationCode = await generateUniqueVerificationCode();
    
    // Добавляем verificationCode в certificationData для resolveVariableValue
    const dataForTemplate = certificationData ? {
      ...certificationData,
      verificationCode,
      award: {
        ...certificationData.award,
        verificationCode,
      }
    } : { verificationCode, award: { verificationCode } };
    
    // Читаем фоновое изображение
    const bgPath = join(process.cwd(), 'public', template.backgroundUrl);
    const backgroundBuffer = await readFile(bgPath);
    
    // Загружаем изображение
    const background = await loadImage(backgroundBuffer);
    const originalWidth = background.width;
    const originalHeight = background.height;
    
    // Определяем наибольшее измерение и ограничиваем до 2339px
    const MAX_SIZE = 2339;
    const maxDimension = Math.max(originalWidth, originalHeight);
    
    // Если ни одно измерение не превышает 2339, оставляем как есть
    let width: number;
    let height: number;
    if (maxDimension <= MAX_SIZE) {
      width = originalWidth;
      height = originalHeight;
    } else {
      // Уменьшаем пропорционально
      const scale = MAX_SIZE / maxDimension;
      width = Math.round(originalWidth * scale);
      height = Math.round(originalHeight * scale);
    }
    
    // Создаём canvas с рассчитанными размерами
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Рисуем фон с масштабированием
    ctx.drawImage(background, 0, 0, width, height);
    
    // Получаем поля из fieldsJson
    const fieldsConfig = (template.fieldsJson as any)?.fields || [];
    
    // Рисуем текст для каждого поля
    for (const field of fieldsConfig) {
      const variable = field.variable as string;
      if (!variable) continue;
      
      // Получаем значение переменной
      let value = await resolveVariableValue(variable, userId, dataForTemplate);
      
      // Форматируем дату если нужно
      if (field.formatDate && variable.includes('issuedAt')) {
        const dateFormat = field.dateFormat || 'DD.MM.YYYY';
        value = formatDateValue(value, dateFormat);
      }
      
      if (!value) continue;
      
      const x = (field.xPercent / 100) * width;
      const y = (field.yPercent / 100) * height;
      const fontSize = field.fontSize || 24;
      const fontColor = field.fontColor || '#333333';
      const fontWeight = field.fontWeight || 'normal';
      const textAlign = field.textAlign || 'center';
      
      // Выбираем шрифт в зависимости от начертания
      const fontFamily = fontWeight === 'bold' ? 'PT Serif Bold' : 'PT Serif';
      
      ctx.font = `${fontSize}px "${fontFamily}"`;
      ctx.fillStyle = fontColor;
      ctx.textAlign = textAlign as CanvasTextAlign;
      ctx.textBaseline = 'middle';
      
      ctx.fillText(value, x, y);
    }
    
    // Конвертируем в буфер
    const result = canvas.toBuffer('image/png');
    
    // Сохраняем в public/certificates
    await mkdir(PREVIEW_DIR, { recursive: true });
    const filename = `cert-${Date.now()}-${userId}.png`;
    const filepath = join(PREVIEW_DIR, filename);
    await writeFile(filepath, result);
    
    const imageUrl = `/certificates/${filename}`;
    
    // Создаём запись в БД с проверочным кодом
    const certificate = await prisma.certificate.create({
      data: {
        templateId,
        userId,
        dataJson: { ...customValues, verificationCode },
        imageUrl,
        verificationCode
      }
    });
    
    return { success: true, certificate, imageUrl };
  } catch (error) {
    console.error('Ошибка генерации сертификата:', error);
    return { error: 'Ошибка генерации сертификата: ' + (error as Error).message };
  }
}