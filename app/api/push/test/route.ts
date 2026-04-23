import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"
import { SITE } from "@/lib/config"

export async function POST() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "Пользователь не авторизован" }, { status: 401 })
    }

    const webPush = await import("web-push")

    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json({ success: false, error: "VAPID ключи не настроены" }, { status: 500 })
    }

    webPush.setVapidDetails(
      "mailto:admin@dvmeste.ru",
      vapidPublicKey,
      vapidPrivateKey
    )

    // Получаем подписки пользователя
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: user.id },
    })

    if (subscriptions.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Нет активных подписок. Включите уведомления в браузере.",
        subscriptionsCount: 0
      }, { status: 400 })
    }

    const notificationPayload = JSON.stringify({
      title: "🔔 Тестовое уведомление",
      body: "Пуш-уведомления работают правильно!",
      url: `${SITE.baseUrl}/account/push`,
      icon: "/logo.png",
    })

    let sentCount = 0
    let failedCount = 0

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
        failedCount++
        // Если подписка недействительна — удаляем её
        if (error.statusCode === 410) {
          await prisma.pushSubscription.delete({
            where: { endpoint: subscription.endpoint },
          })
        }
        console.error("Error sending test push to subscription:", error)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Отправлено ${sentCount} уведомлений`,
      sent: sentCount,
      failed: failedCount,
      total: subscriptions.length
    })
  } catch (error) {
    console.error("Error sending test push notification:", error)
    return NextResponse.json({ success: false, error: "Ошибка при отправке тестового уведомления" }, { status: 500 })
  }
}