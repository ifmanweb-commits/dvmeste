'use server'

import { prisma } from '@/lib/prisma'
import { User } from '@prisma/client';
import { requireAdmin } from '@/lib/auth/require'
import { Prisma, PsychologistStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { promises as fs } from "fs";
import path from "path";

// ======================================
// ТИПЫ И ИНТЕРФЕЙСЫ
// ======================================

/**
 * Интерфейс для данных черновика (DraftData).
 * Хранит текущие данные пользователя и статус модерации черновика.
 */
export interface DraftData {
  status: 'PENDING' | 'REJECTED';
  submittedAt: string;
  comment?: string;
  data: {
    shortBio?: string;
    longBio?: string;
    mainParadigm?: string[];
    firstDiplomaDate?: string;
  };
}

export type ModerationProfile = {
  id: string;
  fullName: string;
  email: string;
  status: 'CANDIDATE' | 'ACTIVE' | 'REJECTED' | 'BLOCKED'; // Текущий статус в БД
  isPublished: boolean;
  shortBio?: string;
  longBio?: string;
  city?: string;
  price?: number;
  certificationLevel?: number;
  mainParadigm?: string[];
  draftData: DraftData | null; // Содержимое поля draftData
};

// ======================================
// ПОЛУЧЕНИЕ СПИСКОВ
// ======================================

export async function getPsychologistsList() {
  await requireAdmin()
  
  if (!prisma) return []
  
  try {
    const list = await prisma.user.findMany({
      where: {
        status: {
          in: [PsychologistStatus.ACTIVE, PsychologistStatus.REJECTED, PsychologistStatus.BLOCKED]
        }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        city: true,
        price: true,
        certificationLevel: true,
        status: true,
        isPublished: true,
        createdAt: true,
        slug: true,
        mainParadigm: true,
        contactInfo: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    
    return list.map(user => ({
      id: user.id,
      slug: user.slug,
      fullName: user.fullName || 'Без имени',
      city: user.city,
      isPublished: user.isPublished,
      price: user.price,
      certificationLevel: user.certificationLevel?.toString(),
    }))
  } catch (error) {
    console.error('Error fetching psychologists list:', error)
    return []
  }
}

export async function getCandidatesList({ 
  page, 
  limit, 
  search = '' 
}: { 
  page: number
  limit: number
  search?: string
}) {
  await requireAdmin()
  
  if (!prisma) {
    return {
      items: [],
      total: 0,
      pages: 0,
      currentPage: page
    }
  }

  try {
    const where: Prisma.UserWhereInput = {
      status: 'CANDIDATE'
    }

    if (search) {
      where.OR = [
        { 
          fullName: { 
            contains: search, 
            mode: Prisma.QueryMode.insensitive 
          } 
        },
        { 
          email: { 
            contains: search, 
            mode: Prisma.QueryMode.insensitive 
          } 
        }
      ]
    }

    const total = await prisma.user.count({ where })

    const items = await prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        city: true,
        price: true,
        certificationLevel: true,
        status: true,
        createdAt: true,
        workFormat: true,
        mainParadigm: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    })

    return {
      items,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    }
  } catch (error) {
    console.error('Error fetching candidates:', error)
    return {
      items: [],
      total: 0,
      pages: 0,
      currentPage: page
    }
  }
}

// ======================================
// ПОЛУЧЕНИЕ ОДНОГО ПОЛЬЗОВАТЕЛЯ
// ======================================

export async function getPsychologistById(id: string) {
  await requireAdmin()
  
  if (!prisma) return null

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        documents: {
          select: {
            id: true,
            type: true,
            filename: true,
            url: true,
            verifiedAt: true,
            uploadedAt: true,
          },
          orderBy: {
            uploadedAt: 'desc'
          }
        },
        articles: {
          where: { isPublished: true },
          select: {
            id: true,
            title: true,
            slug: true,
            publishedAt: true,
          },
          orderBy: {
            publishedAt: 'desc'
          }
        },
      },
    })
    return user
  } catch (error) {
    console.error('Error fetching psychologist for admin:', error)
    return null
  }
}

// ======================================
// ОБНОВЛЕНИЕ ПОЛЬЗОВАТЕЛЯ
// ======================================

export async function updatePsychologist(formData: FormData) {
  await requireAdmin();
  if (!prisma) return;
  console.log("RECEIVED DATA:", Object.fromEntries(formData.entries()));

  const id = formData.get("id") as string;
  if (!id) throw new Error("ID не найден");

  try {
    // Собираем данные и приводим к нужным типам
    const rawMainParadigm = formData.get("mainParadigm") as string;
    let mainParadigm: string[] = [];
    try {
      mainParadigm = JSON.parse(rawMainParadigm);
    } catch (e) {
      mainParadigm = [];
    }

    const data: Prisma.UserUpdateInput = {
      fullName: (formData.get("fullName") as string) || null,
      email: (formData.get("email") as string) || undefined,
      slug: (formData.get("slug") as string) || null,
      city: (formData.get("city") as string) || null,
      gender: (formData.get("gender") as string) || null,
      workFormat: (formData.get("workFormat") as string) || null,
      shortBio: (formData.get("shortBio") as string) || null,
      longBio: (formData.get("longBio") as string) || null,
      contactInfo: (formData.get("contactInfo") as string) || null,

      // Числа
      price: formData.get("price") ? Number(formData.get("price")) : null,
      freeSession: formData.get("freeSession") ? Number(formData.get("freeSession")) : 0,
      certificationLevel: formData.get("certificationLevel") ? Number(formData.get("certificationLevel")) : 0,

      // Даты
      birthDate: formData.get("birthDate") ? new Date(formData.get("birthDate") as string) : null,
      firstDiplomaDate: formData.get("firstDiplomaDate") ? new Date(formData.get("firstDiplomaDate") as string) : null,
      lastCertificationDate: formData.get("lastCertificationDate") ? new Date(formData.get("lastCertificationDate") as string) : null,

      // Массивы и статусы
      mainParadigm: mainParadigm,
      status: (formData.get("status") as any) || "PENDING",
      isPublished: formData.get("isPublished") === "on",

      // При прямом сохранении админом сбрасываем флаг наличия изменений
      hasUnpublishedChanges: false
    };

    await prisma.user.update({
      where: { id },
      data
    });

    revalidatePath(`/admin/psychologists/${id}/edit`);
    revalidatePath(`/admin/psychologists`);
  } catch (error) {
    console.error("Update error:", error);
    throw error;
  }
}

// ======================================
// УДАЛЕНИЕ ДОКУМЕНТА
// ======================================

export async function deleteDocumentAsAdmin(docId: string, psychologistId: string) {
  await requireAdmin();
  if (!prisma) return { success: false, error: "Ошибка подключения к БД" };

  try {
    const doc = await prisma.document.findUnique({
      where: { id: docId }
    });

    if (!doc) return { success: false, error: "Документ не найден" };

    // 1. Удаляем запись из БД
    await prisma.document.delete({ where: { id: docId } });

    // 2. Если это было фото и оно стояло как аватар — сбрасываем аватар у психолога
    const psych = await prisma.user.findUnique({ where: { id: psychologistId } });
    if (doc.type === 'PHOTO' && psych?.avatarUrl === doc.url) {
      await prisma.user.update({
        where: { id: psychologistId },
        data: { avatarUrl: null }
      });
    }

    // 3. Удаляем файл с диска
    const filePath = path.join(process.cwd(), "public", doc.url);
    await fs.unlink(filePath).catch(() => console.log("Файл уже удален физически или путь неверный"));

    revalidatePath(`/admin/psychologists/${psychologistId}/edit`);
    return { success: true };
  } catch (error) {
    console.error("Admin delete error:", error);
    return { success: false, error: "Ошибка при удалении" };
  }
}

// ======================================
// ОБНОВЛЕНИЕ СТАТУСА (Черновик -> Активен/Отклонен)
// ======================================

export async function updatePsychologistStatus(id: string, status: 'CANDIDATE' | 'ACTIVE' | 'REJECTED' | 'BLOCKED') {
  await requireAdmin()
  
  if (!prisma) return null

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: { 
        status,
        ...(status === 'ACTIVE' && { isPublished: true }),
        ...(status !== 'ACTIVE' && status !== 'CANDIDATE' && { isPublished: false }),
      },
    })

    return updated
  } catch (error) {
    console.error('Error updating user status:', error)
    return null
  }
}

// ======================================
// ПУБЛИКАЦИЯ/СКРЫТИЕ
// ======================================

export async function togglePsychologistPublish(id: string, publish: boolean) {
  await requireAdmin()
  
  if (!prisma) return null

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: { 
        isPublished: publish,
      },
    })
    
    return updated
  } catch (error) {
    console.error('Error toggling user publish:', error)
    return null
  }
}

// ======================================
// БЛОКИРОВКА/РАЗБЛОКИРОВКА
// ======================================

export async function togglePsychologistBlock(id: string, block: boolean) {
  await requireAdmin()
  
  if (!prisma) return null

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: { 
        status: block ? 'BLOCKED' : 'ACTIVE',
        isPublished: block ? false : true,
      },
    })

    return updated
  } catch (error) {
    console.error('Error toggling user block:', error)
    throw error
  }
}

// ======================================
// ПОЛУЧЕНИЕ ПРОФИЛЕЙ НА МОДЕРАЦИЮ (С НЕПУСТЫМ draftData)
// ======================================

export async function getProfilesForModeration() {
  await requireAdmin();

  if (!prisma) return []

  try {
    const users = await prisma.user.findMany({
      where: {
        draftData: {
          not: Prisma.JsonNull
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return users.map(user => ({
      id: user.id,
      fullName: user.fullName || 'Без имени',
      email: user.email,
      status: user.status,
      isPublished: user.isPublished,
      shortBio: user.shortBio,
      longBio: user.longBio,
      city: user.city,
      price: user.price,
      certificationLevel: user.certificationLevel,
      mainParadigm: user.mainParadigm,
      draftData: user.draftData as any || null,
    }));
  } catch (error) {
    console.error('Error fetching profiles for moderation:', error);
    return [];
  }
}
// ======================================
// ОДОБРЕНИЕ ЧЕРНОВИКА (ПРИНЯТЬ)
// ======================================

export async function approveProfileDraft(userId: string) {
  await requireAdmin();
  
  if (!prisma) return { success: false, error: "Нет подключения к БД" };

  try {
    // Получаем пользователя с черновиком
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        draftData: true,
        fullName: true,
        email: true 
      }
    });

    if (!user) {
      return { success: false, error: "Пользователь не найден" };
    }

    if (!user.draftData) {
      return { success: false, error: "Черновик не найден" };
    }

    // Приводим через unknown для обхода проверки типов
    const draft = user.draftData as unknown as DraftData;
    
    // Проверяем, что структура соответствует ожидаемой
    if (!draft.status || !draft.submittedAt || !draft.data) {
      return { success: false, error: "Неверный формат черновика" };
    }

    if (draft.status !== 'PENDING') {
      return { success: false, error: "Черновик не в статусе PENDING" };
    }

    // Копируем только нужные поля из черновика в основные поля
    const updateData: Prisma.UserUpdateInput = {};
    
    if (draft.data.shortBio !== undefined) {
      updateData.shortBio = draft.data.shortBio;
    }
    
    if (draft.data.longBio !== undefined) {
      updateData.longBio = draft.data.longBio;
    }
    
    if (draft.data.mainParadigm !== undefined) {
      updateData.mainParadigm = draft.data.mainParadigm;
    }
    
    if (draft.data.firstDiplomaDate !== undefined) {
      updateData.firstDiplomaDate = draft.data.firstDiplomaDate ? new Date(draft.data.firstDiplomaDate) : null;
    }
    
    // Очищаем черновик
    updateData.draftData = '';

    await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    revalidatePath('/admin/moderation/profiles');
    revalidatePath(`/admin/psychologists/${userId}/edit`);
    
    return { success: true };
  } catch (error) {
    console.error('Error approving profile draft:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Ошибка при одобрении черновика' 
    };
  }
}

// ======================================
// ОТКЛОНЕНИЕ ЧЕРНОВИКА
// ======================================

export async function rejectProfileDraft(userId: string, comment: string) {
  await requireAdmin();
  
  if (!prisma) return { success: false, error: "Нет подключения к БД" };
  
  if (!comment || !comment.trim()) {
    return { success: false, error: "Комментарий обязателен" };
  }

  try {
    // Получаем пользователя с черновиком
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        draftData: true,
        fullName: true,
        email: true 
      }
    });

    if (!user) {
      return { success: false, error: "Пользователь не найден" };
    }

    if (!user.draftData) {
      return { success: false, error: "Черновик не найден" };
    }

    // Приводим через unknown
    const draft = user.draftData as unknown as DraftData;
    
    // Проверяем структуру
    if (!draft.status || !draft.submittedAt || !draft.data) {
      return { success: false, error: "Неверный формат черновика" };
    }

    if (draft.status !== 'PENDING') {
      return { success: false, error: "Черновик не в статусе PENDING" };
    }

    // Обновляем статус черновика на REJECTED и добавляем комментарий
    // Сохраняем все существующие данные, меняем только статус и комментарий
    const updatedDraft = {
      ...draft,
      status: 'REJECTED' as const,
      comment: comment.trim()
    };

    await prisma.user.update({
      where: { id: userId },
      data: {
        draftData: updatedDraft as any // Prisma принимает любой JSON
      }
    });

    revalidatePath('/admin/moderation/profiles');
    revalidatePath('/admin/moderation/profiles/rejected');
    revalidatePath(`/admin/psychologists/${userId}/edit`);
    
    return { success: true };
  } catch (error) {
    console.error('Error rejecting profile draft:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Ошибка при отклонении черновика' 
    };
  }
}


// ======================================
// ДОБАВЛЕНИЕ КОММЕНТАРИЯ К ЧЕРНОВИКУ
// ======================================

export async function addModerationComment(userId: string, comment: string) {
  await requireAdmin()
  
  if (!prisma) return null

  try {
    const moderator = await requireAdmin()
    
    // 1. Получаем текущие данные пользователя (чтобы не потерять их при отклонении)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        shortBio: true,
        longBio: true,
        mainParadigm: true,
        firstDiplomaDate: true,
        // ... другие поля из draftData.data, если они есть в User
      }
    })

    if (!user) return null

    // 2. Обновляем черновик: ставим REJECTED, добавляем комментарий И СОХРАНЯЕМ ДАННЫЕ ПРОФИЛЯ
    await prisma.user.update({
      where: { id: userId },
      data: {
        draftData: {
          status: 'REJECTED',
          comment: comment,
          submittedAt: new Date().toISOString(), // Обновляем дату отправки (или оставляем старую?)
          data: {
            shortBio: user.shortBio || '',
            longBio: user.longBio || '',
            mainParadigm: user.mainParadigm || [],
            firstDiplomaDate: user.firstDiplomaDate ? new Date(user.firstDiplomaDate.toISOString()) : null,
            // ... остальные поля из User
          }
        }
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Error adding moderation comment:', error)
    return null
  }
}