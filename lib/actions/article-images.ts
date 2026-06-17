// lib/actions/article-images.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";

/**
 * Magic Bytes (сигнатуры файлов) для проверки соответствия MIME-типа
 */
const MAGIC_BYTES: Record<string, { bytes: string; offset?: number }> = {
  'image/jpeg': { bytes: 'ffd8ff' },
  'image/png': { bytes: '89504e470d0a1a0a' },
  'image/webp': { bytes: '52494646', offset: 0 },
};

/**
 * Проверяет Magic Bytes файла на соответствие MIME-типу
 */
async function verifyMagicBytes(file: File, mimeType: string): Promise<boolean> {
  const signature = MAGIC_BYTES[mimeType];
  if (!signature) return true; // Нет сигнатуры для этого типа - пропускаем

  try {
    // Для WebP нужна дополнительная проверка структуры
    if (mimeType === 'image/webp') {
      const buffer = await file.slice(0, 12).arrayBuffer();
      const hex = Buffer.from(buffer).toString('hex');
      // WebP: RIFF....WEBP
      return hex.startsWith('52494646') && hex.substring(8, 12) === '57454250';
    }

    // Для остальных типов проверяем сигнатуру
    const bytesToRead = signature.bytes.length / 2;
    const offset = signature.offset || 0;
    const buffer = await file.slice(offset, offset + bytesToRead).arrayBuffer();
    const hex = Buffer.from(buffer).toString('hex');
    
    return hex.toLowerCase() === signature.bytes.toLowerCase();
  } catch (error) {
    console.error(`[verifyMagicBytes] Error checking ${mimeType}:`, error);
    return true; // В случае ошибки - не блокируем
  }
}

// Транслитерация для имени файла
function transliterate(text: string): string {
  const map: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
    'я': 'ya', 'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
    'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N',
    'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H',
    'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E',
    'Ю': 'Yu', 'Я': 'Ya'
  };
  
  return text.replace(/[а-яА-ЯёЁ]/g, (char) => map[char] || char)
             .replace(/[^a-zA-Z0-9.-]/g, '-')
             .replace(/-+/g, '-')
             .replace(/^-|-$/g, '');
}

// Санитизация имени файла
function sanitizeFilename(filename: string): string {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  const transliterated = transliterate(base);
  const timestamp = Date.now();
  return `${transliterated}-${timestamp}${ext.toLowerCase()}`;
}

export async function getArticleImages(articleId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Не авторизован");

    // Проверяем, что статья принадлежит пользователю
    const article = await prisma.article.findFirst({
      where: { 
        id: articleId,
        userId: user.id
      }
    });

    if (!article) throw new Error("Статья не найдена или доступ запрещён");

    const images = await prisma.articleImage.findMany({
      where: { articleId },
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, images };
  } catch (error: any) {
    console.error("Failed to get images:", error);
    return { success: false, error: error.message };
  }
}

export async function uploadArticleImage(articleId: string, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Не авторизован");

    // Проверяем статью
    const article = await prisma.article.findFirst({
      where: { 
        id: articleId,
        userId: user.id
      }
    });

    if (!article) throw new Error("Статья не найдена или доступ запрещён");

    const file = formData.get("file") as File;
    if (!file) throw new Error("Файл не передан");

    // Валидация
    if (!file.type.startsWith("image/")) {
      throw new Error("Можно загружать только изображения");
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      throw new Error("Размер файла не должен превышать 5 МБ");
    }

    // Проверка Magic Bytes (сигнатуры файла)
    // Защита от подделки MIME-типа (когда файл .exe называют .jpg)
    const isMagicBytesValid = await verifyMagicBytes(file, file.type);
    if (!isMagicBytesValid) {
      console.error(`[uploadArticleImage] Magic Bytes mismatch for file ${file.name}, type: ${file.type}`);
      throw new Error("Файл не соответствует заявленному формату");
    }

    // Создаём папку, если её нет
    const articleDir = path.join(process.cwd(), "public", "files", "articles", articleId);
    await mkdir(articleDir, { recursive: true });

    // Санитизируем имя и сохраняем
    const safeFilename = sanitizeFilename(file.name);
    const filePath = path.join(articleDir, safeFilename);
    const publicUrl = `/files/articles/${articleId}/${safeFilename}`;

    // Конвертируем File в Buffer и сохраняем
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Создаём запись в БД
    const image = await prisma.articleImage.create({
      data: {
        articleId,
        url: publicUrl,
        storagePath: filePath
      }
    });

    revalidatePath(`/account/articles/${articleId}`);
    
    return { 
      success: true, 
      image: {
        id: image.id,
        url: image.url,
        filename: safeFilename
      }
    };
  } catch (error: any) {
    console.error("Failed to upload image:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteArticleImage(imageId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Не авторизован");

    // Получаем изображение с проверкой статьи
    const image = await prisma.articleImage.findUnique({
      where: { id: imageId },
      include: { article: true }
    });

    if (!image) throw new Error("Изображение не найдено");
    
    // Проверяем, что статья принадлежит пользователю
    if (image.article.userId !== user.id) {
      throw new Error("Доступ запрещён");
    }

    // Удаляем файл
    try {
      await unlink(image.storagePath);
    } catch (err) {
      console.warn("File already deleted or not found:", err);
    }

    // Удаляем запись из БД
    await prisma.articleImage.delete({
      where: { id: imageId }
    });

    revalidatePath(`/account/articles/${image.articleId}`);
    
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete image:", error);
    return { success: false, error: error.message };
  }
}