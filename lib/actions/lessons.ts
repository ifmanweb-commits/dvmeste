"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth/session"
import { revalidatePath } from "next/cache"
import { checkCertificationCompletion } from "@/lib/check-certification-completion"

// ==================== CLIENT ACTIONS ====================

/**
 * Получить урок для просмотра
 */
export async function getLesson(challengeId: string, userId: string) {
  try {
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId, type: 'LESSON', isActive: true },
      include: { lesson: true },
    })

    if (!challenge) {
      return { success: false, error: "Урок не найден" }
    }

    const completion = await prisma.lessonCompletion.findUnique({
      where: {
        challengeId_userId: {
          challengeId: challenge.id,
          userId,
        },
      },
    })

    return {
      success: true,
      data: {
        challenge,
        content: challenge.lesson?.content || '',
        isCompleted: !!completion,
        firstViewedAt: completion?.firstViewedAt,
      },
    }
  } catch (error) {
    console.error("Error getting lesson:", error)
    return { success: false, error: "Ошибка при получении урока" }
  }
}

/**
 * Отметить урок как просмотренный (вызывается при открытии страницы)
 */
export async function markLessonAsViewed(challengeId: string, userId: string) {
  try {
    const result = await prisma.lessonCompletion.upsert({
      where: {
        challengeId_userId: {
          challengeId,
          userId,
        },
      },
      update: { lastViewedAt: new Date() },
      create: {
        challengeId,
        userId,
        firstViewedAt: new Date(),
      },
    })

    // Проверяем сертификацию
    await checkCertificationCompletion(userId, challengeId)

    return { success: true, data: result }
  } catch (error) {
    console.error("Error marking lesson as viewed:", error)
    return { success: false, error: "Ошибка при сохранении прогресса" }
  }
}

/**
 * Проверить, разблокирован ли урок (для платных уроков)
 */
export async function checkLessonAccess(challengeId: string, userId: string) {
  try {
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      select: { price: true },
    })

    if (!challenge) {
      return { success: false, error: "Урок не найден", isUnlocked: false }
    }

    // Если урок бесплатный - доступен
    if (!challenge.price || challenge.price === 0) {
      return { success: true, isUnlocked: true, isFree: true }
    }

    // Проверяем, есть ли запись о просмотре (значит уже разблокирован)
    const completion = await prisma.lessonCompletion.findUnique({
      where: {
        challengeId_userId: {
          challengeId,
          userId,
        },
      },
    })

    if (completion) {
      return { success: true, isUnlocked: true, isFree: false }
    }

    // Проверяем состояние挑战 (если были попытки/разблокировки)
    const userState = await prisma.challengeUserState.findUnique({
      where: {
        challengeId_userId: {
          challengeId,
          userId,
        },
      },
    })

    // Если attemptsLeft < base (1), значит использовал попытку
    const isUnlocked = userState ? userState.attemptsLeft < 1 : false

    return { success: true, isUnlocked, isFree: false }
  } catch (error) {
    console.error("Error checking lesson access:", error)
    return { success: false, error: "Ошибка при проверке доступа", isUnlocked: false }
  }
}

// ==================== ADMIN ACTIONS ====================

interface CreateLessonData {
  title: string
  description?: string
  content: string
  isActive?: boolean
  price?: number
  slug?: string
}

/**
 * Создать новый урок
 */
export async function createLesson(data: CreateLessonData) {
  try {
    const user = await getCurrentUser()

    if (!user || (!user.isAdmin && !user.isManager)) {
      return { success: false, error: "Доступ запрещён" }
    }

    if (!data.title || !data.content) {
      return { success: false, error: "Заполните обязательные поля" }
    }

    // Генерируем slug из title если не передан
    const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    // Создаём Challenge и LessonChallenge в транзакции
    const result = await prisma.$transaction(async (tx) => {
      const challenge = await tx.challenge.create({
        data: {
          slug,
          title: data.title,
          description: data.description || null,
          type: 'LESSON',
          isActive: data.isActive ?? true,
          price: data.price ?? null,
        },
      })

      await tx.lessonChallenge.create({
        data: {
          challengeId: challenge.id,
          content: data.content,
        },
      })

      return challenge
    })

    revalidatePath("/admin/challenges")
    return { success: true, data: result }
  } catch (error) {
    console.error("Error creating lesson:", error)
    return { success: false, error: "Ошибка при создании урока" }
  }
}

/**
 * Обновить урок
 */
export async function updateLesson(challengeId: string, data: Partial<CreateLessonData>) {
  try {
    const user = await getCurrentUser()

    if (!user || (!user.isAdmin && !user.isManager)) {
      return { success: false, error: "Доступ запрещён" }
    }

    const existing = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: { lesson: true },
    })

    if (!existing) {
      return { success: false, error: "Урок не найден" }
    }

    if (existing.type !== 'LESSON') {
      return { success: false, error: "Это не урок" }
    }

    await prisma.$transaction(async (tx) => {
      // Обновляем Challenge
      if (data.title !== undefined || data.description !== undefined || data.isActive !== undefined || data.price !== undefined) {
        await tx.challenge.update({
          where: { id: challengeId },
          data: {
            ...(data.title !== undefined && { title: data.title }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
            ...(data.price !== undefined && { price: data.price }),
          },
        })
      }

      // Обновляем LessonChallenge
      if (data.content !== undefined) {
        await tx.lessonChallenge.update({
          where: { challengeId },
          data: { content: data.content },
        })
      }
    })

    revalidatePath("/admin/challenges")
    return { success: true }
  } catch (error) {
    console.error("Error updating lesson:", error)
    return { success: false, error: "Ошибка при обновлении урока" }
  }
}

/**
 * Получить урок для редактирования в админке
 */
export async function getLessonForAdmin(challengeId: string) {
  try {
    const user = await getCurrentUser()

    if (!user || (!user.isAdmin && !user.isManager)) {
      return { success: false, error: "Доступ запрещён" }
    }

    const lesson = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: { lesson: true },
    })

    if (!lesson) {
      return { success: false, error: "Урок не найден" }
    }

    if (lesson.type !== 'LESSON') {
      return { success: false, error: "Это не урок" }
    }

    return { success: true, data: lesson }
  } catch (error) {
    console.error("Error getting lesson for admin:", error)
    return { success: false, error: "Ошибка при получении урока" }
  }
}

/**
 * Удалить урок
 */
export async function deleteLesson(challengeId: string) {
  try {
    const user = await getCurrentUser()

    if (!user || (!user.isAdmin && !user.isManager)) {
      return { success: false, error: "Доступ запрещён" }
    }

    await prisma.challenge.delete({
      where: { id: challengeId },
    })

    revalidatePath("/admin/challenges")
    return { success: true }
  } catch (error) {
    console.error("Error deleting lesson:", error)
    return { success: false, error: "Ошибка при удалении урока" }
  }
}

/**
 * Санитизация HTML (простой regex для удаления опасных тегов)
 */
export async function sanitizeHtml(html: string): Promise<string> {
  // Удаляем script теги и их содержимое
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  
  // Удаляем onclick, onerror, onload и другие опасные атрибуты
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '')
  
  // Удаляем javascript: в href
  sanitized = sanitized.replace(/href\s*=\s*["']?javascript:[^"'\s]*/gi, 'href="#"')
  
  // Удаляем iframe с опасными src
  // sanitized = sanitized.replace(/<iframe[^>]*src\s*=\s*["']?(?!https?:\/\/)[^"']*["'][^>]*>/gi, '')
  
  return sanitized
}
