"use client"

import { useState, useEffect } from "react"
import { NotificationCard } from "./NotificationCard"
import { markAllNotificationsAsRead, getNotifications } from "@/lib/notifications/actions"
import { Loader2 } from "lucide-react"

type Notification = {
  id: string
  userId: string
  type: string
  title: string
  message: string
  linkUrl: string | null
  linkText: string | null
  isRead: boolean
  isArchived: boolean
  expiresAt: Date | null
  createdAt: Date
  metadata: any
}

type NotificationsData = {
  notifications: Notification[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

interface NotificationsClientProps {
  initialData: NotificationsData | null
}

export function NotificationsClient({ initialData }: NotificationsClientProps) {
  const [notificationsData, setNotificationsData] = useState<NotificationsData | null>(initialData)
  const [loading, setLoading] = useState(!initialData)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Авто-пометка всех уведомлений как прочитанные через 2 секунды после входа
  useEffect(() => {
    const timer = setTimeout(() => {
      markAllNotificationsAsRead()
        .then(() => {
          // Обновляем локальное состояние - помечаем все как прочитанные
          if (notificationsData) {
            setNotificationsData({
              ...notificationsData,
              notifications: notificationsData.notifications.map(n => ({ ...n, isRead: true }))
            })
          }
        })
        .catch(console.error)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const loadMore = async () => {
    if (!notificationsData || !notificationsData.hasMore) return

    setLoadingMore(true)
    const result = await getNotifications(notificationsData.page + 1, 20)

    if (result.success && result.data) {
      setNotificationsData({
        ...result.data,
        notifications: [...notificationsData.notifications, ...result.data.notifications]
      })
    } else {
      setError(result.error || "Ошибка загрузки уведомлений")
    }
    setLoadingMore(false)
  }

  if (!notificationsData) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#5858E2]" />
      </div>
    )
  }

  if (notificationsData.notifications.length === 0) {
    return (
      <div className="text-center py-20 bg-white border-2 border-dashed rounded-3xl">
        <p className="text-slate-400 font-medium">У вас пока нет уведомлений</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {notificationsData.notifications.map(notification => (
        <NotificationCard 
          key={notification.id} 
          notification={notification} 
        />
      ))}

      {notificationsData.hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loadingMore ? "Загрузка..." : "Показать ещё"}
          </button>
        </div>
      )}
    </div>
  )
}
