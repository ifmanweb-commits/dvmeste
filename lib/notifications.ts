import { prisma } from "@/lib/prisma"
import { emailService } from "@/lib/email.service"
import { NotificationType } from "@prisma/client"
import { SITE } from "@/lib/config"

/**
 * Данные для отправки уведомления
 */
export interface NotificationData {
  type: NotificationType
  title: string
  message: string
  linkUrl?: string
  linkText?: string
  metadata?: Record<string, any>
}

/**
 * Результат отправки уведомления
 */
export interface SendNotificationResult {
  success: boolean
  sentVia: string[]
  error?: string
}

/**
 * Главная функция отправки уведомлений пользователю.
 * Автоматически определяет доступные способы доставки и отправляет всеми способами.
 * 
 * @param userId - ID пользователя (психолога)
 * @param data - данные уведомления
 * @returns результат отправки
 */
/**
 * Преобразует относительный URL в абсолютный используя SITE.baseUrl
 */
function toAbsoluteUrl(url?: string): string | undefined {
  if (!url) return undefined
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  // Убираем ведущий слэш и соединяем с baseUrl
  const cleanPath = url.startsWith('/') ? url.slice(1) : url
  const base = SITE.baseUrl.endsWith('/') ? SITE.baseUrl.slice(0, -1) : SITE.baseUrl
  return `${base}/${cleanPath}`
}

export async function sendNotification(
  userId: string,
  data: NotificationData
): Promise<SendNotificationResult> {
  const sentVia: string[] = []

  // Преобразуем относительные URL в абсолютные
  const absoluteUrl = toAbsoluteUrl(data.linkUrl)

  try {
    // Получаем пользователя из БД
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        unsubscribed: true,
      },
    })

    if (!user) {
      return { success: false, sentVia, error: "Пользователь не найден" }
    }

    // Отправляем email если не отписан
    if (user.email && !user.unsubscribed) {
      try {
        await sendEmailNotification(user.email, data, absoluteUrl)
        sentVia.push("email")
      } catch (emailError) {
        console.error("Error sending email notification:", emailError)
      }
    }

    // Отправляем push уведомление
    try {
      const pushSent = await sendPushNotification(userId, data, absoluteUrl)
      if (pushSent) {
        sentVia.push("push")
      }
    } catch (pushError) {
      console.error("Error sending push notification:", pushError)
    }

    // Создаем запись в БД
    try {
      await createNotificationRecord(userId, data)
      sentVia.push("database")
    } catch (dbError) {
      console.error("Error creating notification record:", dbError)
    }

    return { success: true, sentVia }
  } catch (error) {
    console.error("Error sending notification:", error)
    return { success: false, sentVia, error: "Ошибка при отправке уведомления" }
  }
}

/**
 * Отправка email уведомления с универсальным шаблоном
 */
async function sendEmailNotification(email: string, data: NotificationData, absoluteUrl?: string): Promise<void> {
  const html = buildUniversalEmailHtml(data, absoluteUrl)

  await emailService.sendEmail({
    to: email,
    subject: data.title,
    html,
  })
}

/**
 * Построение универсального HTML шаблона для email
 */
function buildUniversalEmailHtml(data: NotificationData, absoluteUrl?: string): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${escapeHtml(data.title)}</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #5858E2; border-bottom: 2px solid #5858E2; padding-bottom: 10px;">${escapeHtml(data.title)}</h2>
    <p style="font-size: 16px; margin: 20px 0;">${escapeHtml(data.message)}</p>
    ${absoluteUrl ? `
    <p style="margin-top: 30px;">
      <a href="${escapeHtml(absoluteUrl)}" 
         style="background-color: #5858E2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
        ${escapeHtml(data.linkText || "Перейти")}
      </a>
    </p>
    ` : ""}
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    <p style="color: #777; font-size: 14px;">Это письмо отправлено автоматически.</p>
  </body>
</html>
  `
}

/**
 * Отправка Web Push уведомления
 * @returns true если уведомление было отправлено хотя бы одному устройству
 */
async function sendPushNotification(userId: string, data: NotificationData, absoluteUrl?: string): Promise<boolean> {
  try {
    const webPush = await import("web-push")

    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn("VAPID keys not configured")
      return false
    }

    webPush.setVapidDetails(
      "mailto:admin@dvmeste.ru",
      vapidPublicKey,
      vapidPrivateKey
    )

    // Получаем подписки пользователя
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    })

    if (subscriptions.length === 0) {
      return false
    }

    const notificationPayload = JSON.stringify({
      title: data.title,
      body: data.message,
      url: absoluteUrl || data.linkUrl || `${SITE.baseUrl}/account/notifications`,
      icon: "/icon.png",
    })

    let sentCount = 0

    // Отправляем push каждой подписке
    for (const subscription of subscriptions) {
      try {
        await webPush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          notificationPayload
        )
        sentCount++
      } catch (error: any) {
        // Если подписка недействительна — удаляем её
        if (error.statusCode === 410) {
          await prisma.pushSubscription.delete({
            where: { endpoint: subscription.endpoint },
          })
        }
      }
    }

    return sentCount > 0
  } catch (error) {
    console.error("Error sending push notification:", error)
    return false
  }
}

/**
 * Создание записи уведомления в базе данных
 */
async function createNotificationRecord(userId: string, data: NotificationData): Promise<void> {
  await prisma.notification.create({
    data: {
      userId,
      type: data.type,
      title: data.title,
      message: data.message,
      linkUrl: data.linkUrl,
      linkText: data.linkText,
      metadata: data.metadata || {},
    },
  })
}

/**
 * Экранирование HTML специальных символов
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;')
}

/**
 * Утилита для массовой отправки уведомлений нескольким пользователям
 */
export async function sendNotificationsToUsers(
  userIds: string[],
  data: NotificationData
): Promise<{ results: Record<string, SendNotificationResult> }> {
  const results: Record<string, SendNotificationResult> = {}

  for (const userId of userIds) {
    results[userId] = await sendNotification(userId, data)
  }

  return { results }
}