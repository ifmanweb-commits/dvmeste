"use client"

import { useState, useEffect, useCallback } from "react"
import { subscribePush, unsubscribeAllPush } from "@/lib/actions/push"
import { Instructions } from "./Instructions"
import { ActiveSubscriptions } from "./ActiveSubscriptions"
import { Bell, BellOff, Loader2, AlertCircle } from "lucide-react"

interface PushSubscription {
  id: string
  endpoint: string
  p256dh: string
  auth: string
  deviceType: string | null
  deviceOs: string | null
  browser: string | null
  createdAt: Date
  updatedAt: Date
}

interface PushClientProps {
  initialSubscribed: boolean
  initialSubscriptions: PushSubscription[]
}

export function PushClient({ initialSubscribed, initialSubscriptions }: PushClientProps) {
  const [subscribed, setSubscribed] = useState(initialSubscribed)
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [vapidKey, setVapidKey] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  // Получение VAPID public key при монтировании
  useEffect(() => {
    fetch("/api/push/public-key")
      .then(res => res.json())
      .then(data => setVapidKey(data.publicKey))
      .catch(console.error)
    setIsMounted(true)
  }, [])

  const handleEnableNotifications = useCallback(async () => {
    if (!vapidKey) {
      setError("VAPID ключ не настроен. Обратитесь к администратору.")
      return
    }

    if (!isMounted) return

    setLoading(true)
    setError(null)

    try {
      // Запрашиваем разрешение на уведомления
      const permission = await Notification.requestPermission()

      if (permission === "denied") {
        setPermissionDenied(true)
        setError("Вы запретили уведомления. Разрешите их в настройках браузера.")
        setLoading(false)
        return
      }

      if (permission !== "granted") {
        setError("Разрешение не получено")
        setLoading(false)
        return
      }

      // Регистрируем Service Worker
      const registration = await navigator.serviceWorker.register("/sw.js")
      
      // Ждём активации Service Worker
      await navigator.serviceWorker.ready

      // Проверяем, что Service Worker активен
      if (!registration.active) {
        setError("Service Worker не активен. Перезагрузите страницу.")
        setLoading(false)
        return
      }

      // Получаем подписку
      const uint8Array = urlBase64ToUint8Array(vapidKey)
      const arrayBuffer = uint8Array.buffer.slice(
        uint8Array.byteOffset,
        uint8Array.byteOffset + uint8Array.byteLength
      )
      const applicationServerKey = urlBase64ToUint8Array(vapidKey) as unknown as Uint8Array<ArrayBuffer>
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      })

      // Отправляем подписку на сервер
      const result = await subscribePush({
        endpoint: subscription.endpoint,
        p256dh: arrayBufferToBase64(subscription.getKey("p256dh")!),
        auth: arrayBufferToBase64(subscription.getKey("auth")!)
      })

      if (result.success) {
        setSubscribed(true)
        // Обновляем список подписок
        const newSubscription: PushSubscription = {
          id: Date.now().toString(),
          endpoint: subscription.endpoint,
          p256dh: "",
          auth: "",
          deviceType: null,
          deviceOs: null,
          browser: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        setSubscriptions(prev => [...prev, newSubscription])
      } else {
        setError(result.error || "Ошибка при подписке")
      }
    } catch (err) {
      console.error("Error enabling notifications:", err)
      setError("Ошибка при включении уведомлений")
    } finally {
      setLoading(false)
    }
  }, [vapidKey])

  const handleDisableNotifications = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Отписываемся от всех подписок
      const result = await unsubscribeAllPush()

      if (result.success) {
        setSubscribed(false)
        setSubscriptions([])

        // Отписываемся на уровне браузера
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        if (subscription) {
          await subscription.unsubscribe()
        }
      } else {
        setError(result.error || "Ошибка при отключении")
      }
    } catch (err) {
      console.error("Error disabling notifications:", err)
      setError("Ошибка при отключении уведомлений")
    } finally {
      setLoading(false)
    }
  }, [])

  // Показываем лоадер до монтирования (гидратация)
  if (!isMounted) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#5858E2]" />
      </div>
    )
  }

  // Проверяем поддержку Service Worker и Push
  const isSupported = "serviceWorker" in navigator && "PushManager" in window

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-900 mb-1">
              Push-уведомления не поддерживаются
            </h3>
            <p className="text-sm text-yellow-700">
              Ваш браузер не поддерживает push-уведомления.
              Используйте современные браузеры: Chrome, Firefox, Edge или Safari.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {permissionDenied && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700 mb-2">
            Чтобы вернуть уведомления, разрешите их в настройках браузера:
          </p>
          <ul className="text-sm text-blue-600 list-disc list-inside space-y-1">
            <li>Chrome: Настройки → Конфиденциальность → Настройки сайтов → Уведомления</li>
            <li>Firefox: Настройки → Приватность и защита → Разрешения → Уведомления</li>
          </ul>
        </div>
      )}

      {/* Основная карточка с кнопкой */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {subscribed ? (
              <>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Уведомления включены
                </h2>
              </>
            ) : (
              <>
                <div className="w-3 h-3 bg-gray-300 rounded-full" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Уведомления отключены
                </h2>
              </>
            )}
          </div>

          {subscribed ? (
            <button
              onClick={handleDisableNotifications}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BellOff className="w-4 h-4" />
              {loading ? "Отключаем..." : "Выключить"}
            </button>
          ) : (
            <button
              onClick={handleEnableNotifications}
              disabled={loading || permissionDenied}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#5858E2] hover:bg-[#4a4ac4] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
              {loading ? "Включаем..." : "Включить уведомления"}
            </button>
          )}
        </div>

        <p className="text-sm text-gray-600">
          {subscribed
            ? "Вы будете получать push-уведомления о новых событиях"
            : "Включите уведомления, чтобы не пропустить важные события"}
        </p>
      </div>

      {/* Список активных подписок */}
      <ActiveSubscriptions subscriptions={subscriptions} />

      {/* Инструкции */}
      <Instructions />
    </div>
  )
}

// Вспомогательные функции для работы с ключами
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/")

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = ""
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}
