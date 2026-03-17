"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth/session"

// Получение уведомлений с пагинацией
export async function getNotifications(page: number = 1, limit: number = 20) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: "Пользователь не авторизован", data: null }
    }

    const skip = (page - 1) * limit

    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        isArchived: false,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    })

    const total = await prisma.notification.count({
      where: {
        userId: user.id,
        isArchived: false,
      },
    })

    return {
      success: true,
      data: {
        notifications,
        total,
        page,
        limit,
        hasMore: skip + notifications.length < total,
      },
    }
  } catch (error) {
    console.error("Error getting notifications:", error)
    return { success: false, error: "Ошибка при получении уведомлений", data: null }
  }
}

// Отметка всех уведомлений пользователя как прочитанные
export async function markAllNotificationsAsRead() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: "Пользователь не авторизован" }
    }

    await prisma.notification.updateMany({
      where: {
        userId: user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Error marking notifications as read:", error)
    return { success: false, error: "Ошибка при отметке уведомлений" }
  }
}

// Получение количества непрочитанных уведомлений
export async function getUnreadNotificationsCount() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: "Пользователь не авторизован", count: 0 }
    }

    const count = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false,
        isArchived: false,
      },
    })

    return { success: true, count }
  } catch (error) {
    console.error("Error getting unread notifications count:", error)
    return { success: false, error: "Ошибка при получении счетчика", count: 0 }
  }
}
