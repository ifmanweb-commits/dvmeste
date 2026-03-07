'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/session'
import { PsychologistStatus } from '@prisma/client'
import { promises as fs } from "fs";
import path from "path";
import { DocumentType } from "@prisma/client";

// 1. Обновление базовой информации (Вкладка 1)
export async function updateBasicProfile(values: any) {
  const user = await getCurrentUser()
  if (!user) return { error: "Не авторизован" }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        fullName: values.fullName,
        city: values.city,
        price: Number(values.price),
        gender: values.gender,
        birthDate: values.birthDate ? new Date(values.birthDate) : null,
        workFormat: values.workFormat,
        contactInfo: values.contactInfo,
      },
    })

    revalidatePath('/account/profile')
    return { success: true }
  } catch (e) {
    return { error: "Ошибка при обновлении профиля" }
  }
}

// 2. Сохранение подробной информации в ЧЕРНОВИК (Вкладка 2)
export async function updateDetailedProfileDraft(values: any) {
  const user = await getCurrentUser()
  if (!user || user.status !== PsychologistStatus.ACTIVE) {
    return { error: "Доступно только для активных профилей" }
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        // Данные сохраняются в JSON-поле draftData, не меняя публичный профиль
        draftData: {
          shortBio: values.shortBio,
          longBio: values.longBio,
          mainParadigm: values.mainParadigm,
          firstDiplomaDate: values.firstDiplomaDate,
        },
        hasUnpublishedChanges: true
      },
    })

    revalidatePath('/account/profile')
    return { success: true }
  } catch (e) {
    return { error: "Ошибка при сохранении черновика" }
  }
}

/**
 * Универсальный экшен для регистрации файла в БД
 */
export async function registerUploadedDocument(fileData: { 
  url: string, 
  name: string, 
  size: number,
  type: DocumentType // 'PHOTO' или 'DIPLOMA'
}) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Не авторизован" };

  try {
    // Проверка лимита именно для этого типа документов
    const count = await prisma.document.count({
      where: { userId: user.id, type: fileData.type }
    });

    const limit = fileData.type === 'PHOTO' ? 5 : 10;
    if (count >= limit) return { success: false, error: `Максимум ${limit} файлов этого типа` };

    const newDoc = await prisma.document.create({
      data: {
        userId: user.id,
        type: fileData.type,
        url: fileData.url,
        filename: fileData.name,
        size: fileData.size,
        mimeType: "image/jpeg", 
        verifiedAt: null
      }
    });

    revalidatePath('/account/profile');
    return { success: true, document: newDoc };
  } catch (error) {
    return { success: false, error: "Ошибка регистрации в БД" };
  }
}

// Универсальная функция удаления документа или фото

export async function deleteDocument(docId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Не авторизован" };

  try {
    const doc = await prisma.document.findUnique({
      where: { id: docId, userId: user.id }
    });

    if (!doc) return { success: false, error: "Документ не найден" };

    // 1. Удаляем из БД
    await prisma.document.delete({ where: { id: docId } });

    // 2. Если это было фото и оно стояло как аватар — сбрасываем аватар
    if (doc.type === 'PHOTO' && user.avatarUrl === doc.url) {
      await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl: null }
      });
    }

    // 3. Удаляем файл с диска
    const filePath = path.join(process.cwd(), "public", doc.url);
    await fs.unlink(filePath).catch(() => console.log("Файл уже удален физически"));

    revalidatePath('/account/profile');
    return { success: true };
  } catch (error) {
    console.error("Delete error:", error);
    return { success: false, error: "Ошибка при удалении" };
  }
}

/**
 * Установка фотографии как главной (аватара)
 */
export async function setMainPhoto(photoId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Не авторизован" };

  try {
    const photo = await prisma.document.findUnique({
      where: { id: photoId, userId: user.id }
    });

    if (!photo) return { success: false, error: "Фото не найдено" };

    // Обновляем avatarUrl у пользователя
    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: photo.url }
    });

    revalidatePath('/account/profile');
    return { success: true };
  } catch (error) {
    return { success: false, error: "Ошибка при обновлении аватара" };
  }
}

/**
 * Удаление фотографии (БД + Файловая система)
 */
export async function deletePhoto(photoId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Не авторизован" };

  try {
    const photo = await prisma.document.findUnique({
      where: { id: photoId, userId: user.id }
    });

    if (!photo) return { success: false, error: "Фото не найдено" };

    // 1. Удаляем из БД
    await prisma.document.delete({ where: { id: photoId } });

    // 2. Если это был текущий аватар — сбрасываем его в профиле
    if (user.avatarUrl === photo.url) {
      await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl: null }
      });
    }

    // 3. Пытаемся удалить файл физически
    const filePath = path.join(process.cwd(), "public", photo.url);
    await fs.unlink(filePath).catch(() => console.log("Файл уже удален с диска"));

    revalidatePath('/account/profile');
    return { success: true };
  } catch (error) {
    return { success: false, error: "Ошибка при удалении" };
  }
}


// Вкладка 3: Обновление мета-данных документов
export async function updateDocumentInfo(docId: string, data: any) {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: "Сессия не найдена" }

  try {
    await prisma.document.update({
      where: { 
        id: docId,
        userId: user.id // Проверка владения документом
      },
      data: {
        organization: data.organization,
        year: data.year ? Number(data.year) : null,
        programName: data.programName
      }
    })
    
    revalidatePath('/account/profile')
    return { success: true }
  } catch (error) {
    console.error('UpdateDocError:', error)
    return { success: false, error: "Ошибка при обновлении документа" }
  }
}

/**
 * Обновление текстовых данных диплома
 */
export async function updateDocumentMetadata(
  docId: string, 
  data: { organization?: string; programName?: string; year?: number }
) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Не авторизован" };

  try {
    await prisma.document.update({
      where: { id: docId, userId: user.id },
      data: {
        organization: data.organization,
        programName: data.programName,
        year: data.year
      }
    });
    // Тут revalidatePath не обязателен, если мы используем локальное состояние, 
    // но для надежности оставим
    revalidatePath('/account/profile');
    return { success: true };
  } catch (error) {
    return { success: false, error: "Ошибка обновления данных" };
  }
}