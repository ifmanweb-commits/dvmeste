"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth/session"
import { revalidatePath } from "next/cache"
import { DialogStatus } from "@prisma/client"

const ARCHIVE_PAGE_SIZE = 20

// Очистка текста от HTML-тегов
function sanitizeHtml(text: string): string {
  return text.replace(/<[^>]*>/g, "")
}

// Преобразование URL в кликабельные ссылки
function linkify(text: string): string {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-[#5858E2] hover:underline">$1</a>')
}

// Определение статуса по последнему сообщению
function determineStatusByLastMessage(lastMessage: { direction: string } | null): DialogStatus {
  if (!lastMessage) return DialogStatus.ACTIVE
  return lastMessage.direction === "to_moder" ? DialogStatus.ACTIVE : DialogStatus.WAITING
}

// Получение всех диалогов для модератора
export async function getModerDialogs(archivePage: number = 1) {
  try {
    const user = await getCurrentUser()

    if (!user || (!user.isAdmin && !user.isManager)) {
      return { success: false, error: "Доступ запрещен" }
    }

    // Получаем все диалоги с последним сообщением
    const allDialogs = await prisma.dialog.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      }
    })

    // Разделяем по статусам
    const active = allDialogs.filter(d => d.status === DialogStatus.ACTIVE)
    const waiting = allDialogs.filter(d => d.status === DialogStatus.WAITING)
    const allArchived = allDialogs.filter(d => d.status === DialogStatus.ARCHIVED)

    // Пагинация для архивных
    const totalArchived = allArchived.length
    const archived = allArchived.slice((archivePage - 1) * ARCHIVE_PAGE_SIZE, archivePage * ARCHIVE_PAGE_SIZE)
    const hasMoreArchived = totalArchived > archivePage * ARCHIVE_PAGE_SIZE

    // Форматируем ответ
    const formatDialog = (d: any) => ({
      id: d.id,
      status: d.status,
      lastMessageAt: d.lastMessageAt,
      user: d.user,
      lastMessage: d.messages[0] ? {
        ...d.messages[0],
        text: d.messages[0].text.length > 70 
          ? d.messages[0].text.substring(0, 70) + '...' 
          : d.messages[0].text
      } : null
    })

    return {
      success: true,
      data: {
        active: active.map(formatDialog),
        waiting: waiting.map(formatDialog),
        archived: archived.map(formatDialog),
        archivePagination: {
          currentPage: archivePage,
          totalPages: Math.ceil(totalArchived / ARCHIVE_PAGE_SIZE),
          hasMore: hasMoreArchived,
          total: totalArchived
        }
      }
    }
  } catch (error) {
    console.error("Error getting moderator dialogs:", error)
    return { success: false, error: "Ошибка при получении диалогов" }
  }
}

// Отправить диалог в архив
export async function archiveDialog(dialogId: string) {
  try {
    const user = await getCurrentUser()

    if (!user || (!user.isAdmin && !user.isManager)) {
      return { success: false, error: "Доступ запрещен" }
    }

    await prisma.dialog.update({
      where: { id: dialogId },
      data: { status: DialogStatus.ARCHIVED }
    })

    revalidatePath("/admin/messages")
    return { success: true }
  } catch (error) {
    console.error("Error archiving dialog:", error)
    return { success: false, error: "Ошибка при архивации" }
  }
}

// Вернуть диалог из архива
export async function unarchiveDialog(dialogId: string) {
  try {
    const user = await getCurrentUser()

    if (!user || (!user.isAdmin && !user.isManager)) {
      return { success: false, error: "Доступ запрещен" }
    }

    // Получаем последнее сообщение диалога
    const lastMessage = await prisma.message.findFirst({
      where: { dialogId },
      orderBy: { createdAt: 'desc' }
    })

    const newStatus = determineStatusByLastMessage(lastMessage)

    await prisma.dialog.update({
      where: { id: dialogId },
      data: { status: newStatus }
    })

    revalidatePath("/admin/messages")
    return { success: true }
  } catch (error) {
    console.error("Error unarchiving dialog:", error)
    return { success: false, error: "Ошибка при возврате из архива" }
  }
}

// Получение деталей диалога (для страницы диалога)
export async function getDialogDetail(dialogId: string, page: number = 1, limit: number = 20) {
  try {
    const user = await getCurrentUser()

    if (!user || (!user.isAdmin && !user.isManager)) {
      return { success: false, error: "Доступ запрещен" }
    }

    const dialog = await prisma.dialog.findUnique({
      where: { id: dialogId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          }
        }
      }
    })

    if (!dialog) {
      return { success: false, error: "Диалог не найден" }
    }

    const skip = (page - 1) * limit

    const messages = await prisma.message.findMany({
      where: { dialogId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    })
    const typedMessages = messages.map(msg => ({
        ...msg,
        direction: msg.direction as "to_moder" | "to_user"
        }))

    const total = await prisma.message.count({
      where: { dialogId },
    })

    return {
      success: true,
      data: {
        dialog: {
          id: dialog.id,
          status: dialog.status,
          user: dialog.user,
        },
        messages: typedMessages.map(msg => ({
          ...msg,
          text: linkify(msg.text)
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + typedMessages.length < total,
          total
        }
      }
    }
  } catch (error) {
    console.error("Error getting dialog detail:", error)
    return { success: false, error: "Ошибка при получении диалога" }
  }
}

// Отправка сообщения модератором
export async function sendModerMessage(dialogId: string, text: string) {
  try {
    const user = await getCurrentUser()

    if (!user || (!user.isAdmin && !user.isManager)) {
      return { success: false, error: "Доступ запрещен" }
    }

    const sanitizedText = sanitizeHtml(text).trim()

    if (!sanitizedText) {
      return { success: false, error: "Сообщение не может быть пустым" }
    }

    // Создаем сообщение и обновляем статус диалога на WAITING
    await prisma.$transaction([
      prisma.message.create({
        data: {
          dialogId,
          direction: "to_user",
          text: sanitizedText,
          isRead: false,
        }
      }),
      prisma.dialog.update({
        where: { id: dialogId },
        data: {
          status: DialogStatus.WAITING,
          lastMessageAt: new Date()
        }
      })
    ])

    revalidatePath(`/admin/messages/${dialogId}`)
    revalidatePath("/admin/messages")

    return { success: true }
  } catch (error) {
    console.error("Error sending moderator message:", error)
    return { success: false, error: "Ошибка при отправке" }
  }
}