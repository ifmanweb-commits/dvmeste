"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth/session"
import { revalidatePath } from "next/cache"
import { TipType } from "@prisma/client"
import { normalizeUrl } from "@/lib/utils"

interface CreateTipData {
  title: string
  message: string
  type: TipType
  pageUrl: string
  delaySeconds?: number
  isActive?: boolean
}

interface UpdateTipData extends Partial<CreateTipData> {}

// ==================== SERVER ACTIONS ДЛЯ АДМИНКИ ====================

/**
 * Создать новую подсказку
 */
export async function createTip(data: CreateTipData) {
  try {
    const user = await getCurrentUser()

    if (!user || (!user.isAdmin && !user.isManager)) {
      return { success: false, error: "Доступ запрещён" }
    }

    if (!data.title || !data.message || !data.pageUrl) {
      return { success: false, error: "Заполните обязательные поля" }
    }

    if (data.type === TipType.TOAST && (data.delaySeconds === undefined || data.delaySeconds < 0)) {
      return { success: false, error: "Задержка должна быть неотрицательным числом" }
    }

    // Нормализуем URL перед сохранением
    const normalizedPageUrl = normalizeUrl(data.pageUrl)

    await prisma.onboardingTip.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type,
        pageUrl: normalizedPageUrl,
        delaySeconds: data.delaySeconds ?? 0,
        isActive: data.isActive ?? true,
      },
    })

    revalidatePath("/admin/onboarding")
    return { success: true }
  } catch (error) {
    console.error("Error creating tip:", error)
    return { success: false, error: "Ошибка при создании подсказки" }
  }
}

/**
 * Обновить подсказку
 */
export async function updateTip(id: string, data: UpdateTipData) {
  try {
    const user = await getCurrentUser()

    if (!user || (!user.isAdmin && !user.isManager)) {
      return { success: false, error: "Доступ запрещён" }
    }

    const existing = await prisma.onboardingTip.findUnique({
      where: { id },
    })

    if (!existing) {
      return { success: false, error: "Подсказка не найдена" }
    }

    if (data.title === "" || data.message === "" || data.pageUrl === "") {
      return { success: false, error: "Заполните обязательные поля" }
    }

    const updateData: Record<string, unknown> = {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.message !== undefined && { message: data.message }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.delaySeconds !== undefined && { delaySeconds: data.delaySeconds }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    }

    // Нормализуем URL если он передан
    if (data.pageUrl !== undefined) {
      updateData.pageUrl = normalizeUrl(data.pageUrl)
    }

    await prisma.onboardingTip.update({
      where: { id },
      data: updateData,
    })

    revalidatePath("/admin/onboarding")
    return { success: true }
  } catch (error) {
    console.error("Error updating tip:", error)
    return { success: false, error: "Ошибка при обновлении подсказки" }
  }
}

/**
 * Удалить подсказку
 */
export async function deleteTip(id: string) {
  try {
    const user = await getCurrentUser()

    if (!user || (!user.isAdmin && !user.isManager)) {
      return { success: false, error: "Доступ запрещён" }
    }

    await prisma.onboardingTip.delete({
      where: { id },
    })

    revalidatePath("/admin/onboarding")
    return { success: true }
  } catch (error) {
    console.error("Error deleting tip:", error)
    return { success: false, error: "Ошибка при удалении подсказки" }
  }
}

/**
 * Получить список подсказок с фильтрацией
 */
export async function getTips(filters?: {
  type?: TipType
  pageUrl?: string
  isActive?: boolean
}) {
  try {
    const user = await getCurrentUser()

    if (!user || (!user.isAdmin && !user.isManager)) {
      return { success: false, error: "Доступ запрещён", data: [] }
    }

    const where: Record<string, unknown> = {}

    if (filters?.type !== undefined) {
      where.type = filters.type
    }

    if (filters?.pageUrl !== undefined) {
      // Нормализуем URL для поиска
      const normalizedUrl = normalizeUrl(filters.pageUrl)
      where.pageUrl = {
        contains: normalizedUrl,
        mode: "insensitive",
      }
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive
    }

    const tips = await prisma.onboardingTip.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
    })

    return { success: true, data: tips }
  } catch (error) {
    console.error("Error getting tips:", error)
    return { success: false, error: "Ошибка при получении подсказок", data: [] }
  }
}

/**
 * Получить одну подсказку по ID
 */
export async function getTipById(id: string) {
  try {
    const user = await getCurrentUser()

    if (!user || (!user.isAdmin && !user.isManager)) {
      return { success: false, error: "Доступ запрещён" }
    }

    const tip = await prisma.onboardingTip.findUnique({
      where: { id },
    })

    if (!tip) {
      return { success: false, error: "Подсказка не найдена" }
    }

    return { success: true, data: tip }
  } catch (error) {
    console.error("Error getting tip by id:", error)
    return { success: false, error: "Ошибка при получении подсказки" }
  }
}

// ==================== CLIENT ACTIONS ====================

/**
 * Сохранить закрытие подсказки пользователем
 */
export async function dismissTip(tipId: string) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: "Пользователь не авторизован" }
    }

    // Проверяем, не закрыта ли уже эта подсказка
    const existing = await prisma.userTipDismissal.findUnique({
      where: {
        userId_tipId: {
          userId: user.id,
          tipId,
        },
      },
    })

    if (existing) {
      return { success: true }
    }

    await prisma.userTipDismissal.create({
      data: {
        userId: user.id,
        tipId,
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Error dismissing tip:", error)
    return { success: false, error: "Ошибка при сохранении закрытия подсказки" }
  }
}

/**
 * Получить активные подсказки для текущей страницы (для API)
 */
export async function getActiveTipsForPage(pageUrl: string) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: "Пользователь не авторизован" }
    }

    // Нормализуем URL для поиска
    const normalizedUrl = normalizeUrl(pageUrl)

    // Получаем все активные подсказки для этой страницы
    const allTips = await prisma.onboardingTip.findMany({
      where: {
        pageUrl: normalizedUrl,
        isActive: true,
      },
      orderBy: [
        { delaySeconds: "asc" },
        { createdAt: "asc" },
      ],
    })

    // Получаем IDs закрытых подсказок
    const dismissedTips = await prisma.userTipDismissal.findMany({
      where: { userId: user.id },
      select: { tipId: true },
    })

    const dismissedIds = new Set(dismissedTips.map((d) => d.tipId))

    // Фильтруем закрытые
    const availableTips = allTips.filter((tip) => !dismissedIds.has(tip.id))

    // Отделяем модальное окно от тостов
    const modal = availableTips.find((tip) => tip.type === TipType.MODAL) || null
    const toasts = availableTips
      .filter((tip) => tip.type === TipType.TOAST)
      .sort((a, b) => a.delaySeconds - b.delaySeconds)

    return {
      success: true,
      data: {
        modal,
        toasts,
      },
    }
  } catch (error) {
    console.error("Error getting active tips:", error)
    return { success: false, error: "Ошибка при получении подсказок" }
  }
}