'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/require'
import { Prisma, PsychologistStatus } from '@prisma/client' // добавь PsychologistStatus
import { revalidatePath } from 'next/cache'
import { promises as fs } from "fs";
import path from "path";

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
      fullName: user.fullName || 'Без имени', // string | null -> string
      city: user.city,
      isPublished: user.isPublished,
      price: user.price,
      certificationLevel: user.certificationLevel?.toString(), // number -> string
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
        // Документы (фото и дипломы) с нужными полями
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
        // Список опубликованных статей
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
    //console.log(user);
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
// ОБНОВЛЕНИЕ СТАТУСА
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

    // Создаем запись в модерации
    if (status !== 'CANDIDATE') {
      const moderator = await requireAdmin()
      await prisma.moderationRecord.create({
        data: {
          userId: id,
          status: status === 'ACTIVE' ? 'APPROVED' : 'REVISION',
          comment: status === 'ACTIVE' 
            ? 'Заявка одобрена' 
            : 'Заявка отклонена',
          moderatorId: moderator.id,
        },
      })
    }

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
// КОММЕНТАРИИ МОДЕРАЦИИ
// ======================================

export async function addModerationComment(userId: string, comment: string) {
  await requireAdmin()
  
  if (!prisma) return null

  try {
    const moderator = await requireAdmin()
    
    const record = await prisma.moderationRecord.create({
      data: {
        userId,
        status: 'REVISION',
        comment,
        moderatorId: moderator.id,
      },
    })

    return record
  } catch (error) {
    console.error('Error adding moderation comment:', error)
    return null
  }
}