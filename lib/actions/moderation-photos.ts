'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/require'
import { DocumentType } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { promises as fs } from 'fs'
import path from 'path'

// ======================================
// ТИПЫ
// ======================================

export type UserWithPhotos = {
  user: {
    id: string
    fullName: string | null
    email: string
    avatarUrl: string | null
  }
  photos: Array<{
    id: string
    url: string
    filename: string
    uploadedAt: Date
  }>
}

// ======================================
// SERVER ACTIONS
// ======================================

/**
 * Получить все фото на модерации, сгруппированные по пользователям
 */
export async function getPhotosForModeration(): Promise<UserWithPhotos[]> {
  await requireAdmin()

  if (!prisma) return []

  try {
    // Получаем все непроверенные фото типа PHOTO
    const photos = await prisma.document.findMany({
      where: {
        type: DocumentType.PHOTO,
        verifiedAt: null
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true
          }
        }
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    })

    // Группируем по пользователям
    const userMap = new Map<string, UserWithPhotos>()

    for (const photo of photos) {
      const userId = photo.userId

      if (!userMap.has(userId)) {
        userMap.set(userId, {
          user: {
            id: photo.user.id,
            fullName: photo.user.fullName,
            email: photo.user.email,
            avatarUrl: photo.user.avatarUrl
          },
          photos: []
        })
      }

      userMap.get(userId)!.photos.push({
        id: photo.id,
        url: photo.url,
        filename: photo.filename,
        uploadedAt: photo.uploadedAt
      })
    }

    // Конвертируем Map в массив и сортируем по дате загрузки (сначала новые)
    const result = Array.from(userMap.values())

    return result
  } catch (error) {
    console.error('Error fetching photos for moderation:', error)
    return []
  }
}

/**
 * Одобрить одно фото
 */
export async function approvePhoto(photoId: string) {
  await requireAdmin()

  if (!prisma) {
    throw new Error('Database connection not available')
  }

  try {
    await prisma.document.update({
      where: { id: photoId },
      data: {
        verifiedAt: new Date()
      }
    })

    revalidatePath('/admin/moderation/photos')
    revalidatePath('/catalog') // Обновить кэш каталога
    revalidatePath('/catalog/[slug]') // Обновить кэш профиля
  } catch (error) {
    console.error('Error approving photo:', error)
    throw error
  }
}

/**
 * Отклонить одно фото (удалить)
 */
export async function rejectPhoto(photoId: string) {
  await requireAdmin()

  if (!prisma) {
    throw new Error('Database connection not available')
  }

  try {
    // Получаем информацию о фото
    const photo = await prisma.document.findUnique({
      where: { id: photoId },
      select: {
        url: true,
        userId: true
      }
    })

    if (!photo) {
      throw new Error('Photo not found')
    }

    // Проверяем, является ли это фото аватаром
    const user = await prisma.user.findUnique({
      where: { id: photo.userId },
      select: {
        avatarUrl: true
      }
    })

    // Если это аватар — сбрасываем avatarUrl
    if (user?.avatarUrl === photo.url) {
      await prisma.user.update({
        where: { id: photo.userId },
        data: {
          avatarUrl: null
        }
      })
    }

    // Удаляем файл с диска
    const filePath = path.join(process.cwd(), 'public', photo.url)
    await fs.unlink(filePath).catch(() => {
      // Игнорируем ошибку, если файл уже удалён или не существует
      console.log(`Файл уже удален или не существует: ${filePath}`)
    })

    // Удаляем запись из БД
    await prisma.document.delete({
      where: { id: photoId }
    })

    revalidatePath('/admin/moderation/photos')
    revalidatePath('/catalog') // Обновить кэш каталога
    revalidatePath('/catalog/[slug]') // Обновить кэш профиля
  } catch (error) {
    console.error('Error rejecting photo:', error)
    throw error
  }
}

/**
 * Одобрить все фото пользователя
 */
export async function approveAllUserPhotos(userId: string) {
  await requireAdmin()

  if (!prisma) {
    throw new Error('Database connection not available')
  }

  try {
    await prisma.document.updateMany({
      where: {
        userId: userId,
        type: DocumentType.PHOTO,
        verifiedAt: null
      },
      data: {
        verifiedAt: new Date()
      }
    })

    revalidatePath('/admin/moderation/photos')
    revalidatePath('/catalog') // Обновить кэш каталога
    revalidatePath('/catalog/[slug]') // Обновить кэш профиля
  } catch (error) {
    console.error('Error approving all user photos:', error)
    throw error
  }
}
