// app/account/messages/MessageList.tsx
"use client"

import { useRef, useEffect } from "react"
import { MessageBubble } from "./MessageBubble"
import { Loader2 } from "lucide-react"

interface MessageListProps {
  messages: any[]
  hasMore: boolean
  onLoadMore: () => void
  loadingMore: boolean
  userAvatar?: string | null
}

export function MessageList({ messages, hasMore, onLoadMore, loadingMore, userAvatar }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Автоскролл к последнему сообщению при загрузке
  useEffect(() => {
    if (containerRef.current && messages.length > 0) {
      containerRef.current.scrollTop = 0
    }
  }, [messages])

  // Форматирование даты
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-4">
      {/* Кнопка загрузки ещё */}
      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="px-4 py-2 text-sm text-[#5858E2] border border-[#5858E2] rounded-lg hover:bg-[#5858E2] hover:text-white transition-colors disabled:opacity-50"
          >
            {loadingMore ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Загрузить ещё"
            )}
          </button>
        </div>
      )}

      {/* Сообщения */}
      <div ref={containerRef} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            direction={message.direction}
            timestamp={formatDate(message.createdAt)}
            userAvatar={userAvatar}
          />
        ))}
      </div>

      {/* Пустое состояние */}
      {messages.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <p className="text-gray-500">У вас пока нет сообщений</p>
          <p className="text-sm text-gray-400 mt-1">
            Напишите модераторам — они ответят в ближайшее время
          </p>
        </div>
      )}
    </div>
  )
}