"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth/session"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { parseUserAgent } from "@/lib/utils/user-agent"

// Интерфейс для подписки PushSubscription
interface PushSubscriptionData {
  endpoint: string
  p256dh: string
  auth: string
}

// Сохранить подписку пользователя с информацией об устройстве
export async function subscribePush(subscription: PushSubscriptionData) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: "Пользователь не авторизован" }
    }

    // Получаем User-Agent из заголовков
    const headersList = await headers()
    const userAgent = headersList.get("user-agent") || ""

    // Парсим информацию об устройстве
    const deviceInfo = parseUserAgent(userAgent)

    // Проверяем, есть ли уже такая подписка
    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint: subscription.endpoint }
    })

    if (existing) {
      return { success: true, message: "Подписка уже существует" }
    }

    // Создаем новую подписку
    await prisma.pushSubscription.create({
      data: {
        userId: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.p256dh,
        auth: subscription.auth,
        deviceType: deviceInfo.deviceType,
        deviceOs: deviceInfo.deviceOs,
        browser: deviceInfo.browser,
        userAgent: deviceInfo.userAgent
      }
    })

    revalidatePath("/account/push")
    return { success: true }
  } catch (error) {
    console.error("Error subscribing to push:", error)
    return { success: false, error: "Ошибка при подписке на уведомления" }
  }
}

// Удалить подписку по endpoint
export async function unsubscribePush(endpoint: string) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: "Пользователь не авторизован" }
    }

    await prisma.pushSubscription.delete({
      where: { endpoint }
    })

    revalidatePath("/account/push")
    return { success: true }
  } catch (error) {
    console.error("Error unsubscribing from push:", error)
    return { success: false, error: "Ошибка при отписке от уведомлений" }
  }
}

// Получить все подписки текущего пользователя
export async function getUserSubscriptions() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: "Пользователь не авторизован", data: [] }
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        endpoint: true,
        deviceType: true,
        deviceOs: true,
        browser: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return { success: true, data: subscriptions }
  } catch (error) {
    console.error("Error getting user subscriptions:", error)
    return { success: false, error: "Ошибка при получении подписок", data: [] }
  }
}

// Проверить, есть ли активная подписка
export async function getPushStatus() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: "Пользователь не авторизован", subscribed: false }
    }

    const count = await prisma.pushSubscription.count({
      where: { userId: user.id }
    })

    return { success: true, subscribed: count > 0 }
  } catch (error) {
    console.error("Error getting push status:", error)
    return { success: false, error: "Ошибка при получении статуса", subscribed: false }
  }
}

// Удалить все подписки пользователя
export async function unsubscribeAllPush() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: "Пользователь не авторизован" }
    }

    await prisma.pushSubscription.deleteMany({
      where: { userId: user.id }
    })

    revalidatePath("/account/push")
    return { success: true }
  } catch (error) {
    console.error("Error unsubscribing from all push:", error)
    return { success: false, error: "Ошибка при отписке от всех уведомлений" }
  }
}
