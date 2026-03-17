"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth/session"
import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/auth/require"
import { DialogStatus } from "@prisma/client"

// Очистка текста от HTML-тегов
function sanitizeHtml(text: string): string {
  return text.replace(/<[^>]*>/g, "")
}

// Преобразование URL в кликабельные ссылки
function linkify(text: string): string {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-[#5858E2] hover:underline">$1</a>')
}

// Получение или создание диалога для пользователя
export async function getOrCreateDialog() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: "Пользователь не авторизован", data: null }
    }

    if (user.status === "BLOCKED") {
      return { success: false, error: "Доступ заблокирован", data: null }
    }

    // Ищем существующий диалог
    let dialog = await prisma.dialog.findUnique({
      where: { userId: user.id },
      include: { messages: false }
    })

    // Если нет — создаем
    if (!dialog) {
      dialog = await prisma.dialog.create({
        data: {
          userId: user.id,
          status: DialogStatus.ACTIVE,
        }
      })
    }

    return { success: true, data: dialog }
  } catch (error) {
    console.error("Error getting/creating dialog:", error)
    return { success: false, error: "Ошибка при получении диалога", data: null }
  }
}

// Отправка сообщения (психолог -> модератору)
export async function sendMessage(text: string) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: "Пользователь не авторизован" }
    }

    if (user.status === "BLOCKED") {
      return { success: false, error: "Доступ заблокирован" }
    }

    const sanitizedText = sanitizeHtml(text).trim()

    if (!sanitizedText) {
      return { success: false, error: "Сообщение не может быть пустым" }
    }

    // Получаем или создаем диалог
    const dialog = await prisma.dialog.findUnique({
      where: { userId: user.id }
    })

    if (!dialog) {
      return { success: false, error: "Диалог не найден" }
    }

    // Создаем сообщение и обновляем диалог в одной транзакции
    await prisma.$transaction([
      prisma.message.create({
        data: {
          dialogId: dialog.id,
          direction: "to_moder",
          text: sanitizedText,
          isRead: false,
        }
      }),
      prisma.dialog.update({
        where: { id: dialog.id },
        data: {
          status: DialogStatus.ACTIVE,
          lastMessageAt: new Date()
        }
      })
    ])

    revalidatePath("/account/messages")
    revalidatePath("/admin/messages")

    return { success: true }
  } catch (error) {
    console.error("Error sending message:", error)
    return { success: false, error: "Ошибка при отправке сообщения" }
  }
}

// Отправка сообщения модератором психологу
export async function sendMessageAsModer(userId: string, text: string) {
  try {
    const user = await getCurrentUser()

    if (!user || (!user.isAdmin && !user.isManager)) {
      return { success: false, error: "Доступ запрещен" }
    }

    const sanitizedText = sanitizeHtml(text).trim()

    if (!sanitizedText) {
      return { success: false, error: "Сообщение не может быть пустым" }
    }

    // Получаем или создаем диалог для пользователя
    let dialog = await prisma.dialog.findUnique({
      where: { userId }
    })

    if (!dialog) {
      dialog = await prisma.dialog.create({
        data: {
          userId,
          status: DialogStatus.WAITING,
        }
      })
    }

    // Создаем сообщение и обновляем диалог
    await prisma.$transaction([
      prisma.message.create({
        data: {
          dialogId: dialog.id,
          direction: "to_user",
          text: sanitizedText,
          isRead: false,
        }
      }),
      prisma.dialog.update({
        where: { id: dialog.id },
        data: {
          status: DialogStatus.WAITING,
          lastMessageAt: new Date()
        }
      })
    ])

    revalidatePath("/admin/messages")
    revalidatePath(`/admin/messages/${userId}`)

    return { success: true }
  } catch (error) {
    console.error("Error sending message as moderator:", error)
    return { success: false, error: "Ошибка при отправке сообщения" }
  }
}

// Получение сообщений для психолога (с пагинацией)
export async function getMessages(page: number = 1, limit: number = 20) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: "Пользователь не авторизован", data: null }
    }

    if (user.status === "BLOCKED") {
      return { success: false, error: "Доступ заблокирован", data: null }
    }

    // Получаем диалог пользователя
    const dialog = await prisma.dialog.findUnique({
      where: { userId: user.id }
    })

    if (!dialog) {
      return {
        success: true,
        data: {
          messages: [],
          total: 0,
          page,
          limit,
          hasMore: false,
          dialog: null
        }
      }
    }

    const skip = (page - 1) * limit

    const messages = await prisma.message.findMany({
      where: {
        dialogId: dialog.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    })

    const total = await prisma.message.count({
      where: {
        dialogId: dialog.id,
      },
    })

    // Помечаем сообщения от модератора как прочитанные
    await markDialogMessagesAsRead(dialog.id)

    return {
      success: true,
      data: {
        messages: messages.map(msg => ({
          ...msg,
          text: linkify(msg.text)
        })),
        total,
        page,
        limit,
        hasMore: skip + messages.length < total,
        dialog: {
          id: dialog.id,
          status: dialog.status,
          lastMessageAt: dialog.lastMessageAt
        }
      },
    }
  } catch (error) {
    console.error("Error getting messages:", error)
    return { success: false, error: "Ошибка при получении сообщений", data: null }
  }
}

// Получение всех диалогов для модератора
export async function getAllDialogsForModer() {
  try {
    const user = await getCurrentUser()

    if (!user || (!user.isAdmin && !user.isManager)) {
      return { success: false, error: "Доступ запрещен", data: [] }
    }

    const dialogs = await prisma.dialog.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            status: true,
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        },
        _count: {
          select: {
            messages: {
              where: {
                direction: "to_user",
                isRead: false
              }
            }
          }
        }
      },
      orderBy: [
        { status: 'asc' }, // ACTIVE first, then WAITING, then ARCHIVED
        { lastMessageAt: 'desc' }
      ]
    })

    return {
      success: true,
      data: dialogs.map(d => ({
        id: d.id,
        userId: d.userId,
        status: d.status,
        lastMessageAt: d.lastMessageAt,
        user: d.user,
        lastMessage: d.messages[0] || null,
        unreadCount: d._count.messages
      }))
    }
  } catch (error) {
    console.error("Error getting dialogs for moderator:", error)
    return { success: false, error: "Ошибка при получении диалогов", data: [] }
  }
}

// Получение сообщений конкретного диалога для модератора
export async function getDialogMessages(dialogId: string, page: number = 1, limit: number = 20) {
  try {
    const user = await getCurrentUser()

    if (!user || (!user.isAdmin && !user.isManager)) {
      return { success: false, error: "Доступ запрещен", data: null }
    }

    const skip = (page - 1) * limit

    const messages = await prisma.message.findMany({
      where: {
        dialogId: dialogId,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    })

    const total = await prisma.message.count({
      where: {
        dialogId: dialogId,
      },
    })

    return {
      success: true,
      data: {
        dialogId,
        messages: messages.map(msg => ({
          ...msg,
          text: linkify(msg.text)
        })),
        total,
        page,
        limit,
        hasMore: skip + messages.length < total,
      },
    }
  } catch (error) {
    console.error("Error getting dialog messages:", error)
    return { success: false, error: "Ошибка при получении сообщений", data: null }
  }
}

// Отметка сообщений диалога как прочитанные
export async function markDialogMessagesAsRead(dialogId: string) {
  try {
    await prisma.message.updateMany({
      where: {
        dialogId: dialogId,
        direction: "to_user",
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Error marking messages as read:", error)
    return { success: false, error: "Ошибка при отметке сообщений" }
  }
}

// Обновление статуса диалога (для модератора)
export async function updateDialogStatus(dialogId: string, status: DialogStatus) {
  try {
    const user = await getCurrentUser()

    if (!user || (!user.isAdmin && !user.isManager)) {
      return { success: false, error: "Доступ запрещен" }
    }

    await prisma.dialog.update({
      where: { id: dialogId },
      data: { status }
    })

    revalidatePath("/admin/messages")
    return { success: true }
  } catch (error) {
    console.error("Error updating dialog status:", error)
    return { success: false, error: "Ошибка при обновлении статуса" }
  }
}

// Получение количества непрочитанных сообщений для психолога
export async function getUnreadCount() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: "Пользователь не авторизован", count: 0 }
    }

    const dialog = await prisma.dialog.findUnique({
      where: { userId: user.id }
    })

    if (!dialog) {
      return { success: true, count: 0 }
    }

    const count = await prisma.message.count({
      where: {
        dialogId: dialog.id,
        direction: "to_user",
        isRead: false,
      },
    })

    return { success: true, count }
  } catch (error) {
    console.error("Error getting unread count:", error)
    return { success: false, error: "Ошибка при получении счетчика", count: 0 }
  }
}