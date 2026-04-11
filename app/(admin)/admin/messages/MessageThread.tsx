"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Send, Loader2, ChevronLeft, User, Bot } from "lucide-react"

type Message = {
  id: string
  dialogId: string
  direction: "to_moder" | "to_user"
  text: string
  isRead: boolean
  createdAt: Date
}

type Pagination = {
  currentPage: number
  totalPages: number
  hasMore: boolean
  total: number
}

type MessageThreadProps = {
  dialogId: string
  initialMessages: Message[]
  initialPagination: Pagination
  sendMessageAction: (dialogId: string, text: string) => Promise<{ success: boolean; error?: string }>
}

export function MessageThread({ 
  dialogId, 
  initialMessages, 
  initialPagination,
  sendMessageAction 
}: MessageThreadProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>(() => 
    initialMessages.map(msg => ({
      id: msg.id,
      dialogId: msg.dialogId,
      text: msg.text,
      isRead: msg.isRead,
      createdAt: msg.createdAt,
      direction: msg.direction as "to_moder" | "to_user"
    }))
  )
  const [pagination, setPagination] = useState<Pagination>(initialPagination)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [loadingPage, setLoadingPage] = useState(false)

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return

    const messageText = newMessage.trim()
    
    // Создаем временное сообщение для мгновенного отображения
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      dialogId,
      direction: "to_user", // модератор -> пользователь
      text: messageText,
      isRead: false,
      createdAt: new Date()
    }

    // Добавляем в список сразу
    setMessages(prev => [tempMessage, ...prev])
    setNewMessage("")
    setSending(true)

    try {
      const result = await sendMessageAction(dialogId, messageText)
      
      if (!result.success) {
        // Если ошибка — удаляем временное сообщение
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
        alert(result.error || "Ошибка при отправке")
      }
      // При успехе оставляем сообщение, сервер вернет настоящее с правильным ID
    } catch (error) {
      // Ошибка — удаляем временное сообщение
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
      alert("Ошибка при отправке")
    } finally {
      setSending(false)
    }
  }

  const loadPage = async (page: number) => {
    setLoadingPage(true)
    try {
      const url = new URL(window.location.href)
      url.searchParams.set("page", page.toString())
      router.push(url.toString())
    } finally {
      setLoadingPage(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      {/* Форма ответа */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex gap-3">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Напишите ответ..."
            rows={3}
            disabled={sending}
            className="flex-1 p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5858E2] focus:border-transparent resize-none disabled:bg-gray-50"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="self-end px-6 py-3 bg-[#5858E2] text-white rounded-lg text-sm font-medium hover:bg-[#4b4bcf] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Отправить
                <Send className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Сообщения */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Пагинация сверху */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => loadPage(pagination.currentPage + 1)}
              disabled={!pagination.hasMore || loadingPage}
              className="inline-flex items-center gap-1 text-sm text-[#5858E2] hover:text-[#4b4bcf] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingPage ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4" />
                  Старые сообщения
                </>
              )}
            </button>
            <span className="text-sm text-gray-500">
              Страница {pagination.currentPage} из {pagination.totalPages}
            </span>
          </div>
        )}

        {/* Список сообщений */}
        <div className="divide-y divide-gray-100">
          {messages.length > 0 ? (
            messages.map((message) => (
              <div
                key={message.id}
                className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors"
              >
                {/* Аватар */}
                <div className="flex-shrink-0">
                  {message.direction === "to_moder" ? (
                    // Сообщение от клиента - аватар пользователя
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                  ) : (
                    // Сообщение от модератора - иконка бота
                    <div className="w-10 h-10 rounded-full bg-[#5858E2]/10 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-[#5858E2]" />
                    </div>
                  )}
                </div>

                {/* Контент */}
                <div className="flex-1 min-w-0">
                  {/* Имя отправителя и время */}
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-gray-900 text-sm">
                      {message.direction === "to_moder" ? "Клиент" : "Модератор"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(message.createdAt)}
                    </span>
                  </div>

                  {/* Текст сообщения */}
                  <div
                    className="text-sm text-gray-700 whitespace-pre-wrap break-words"
                    dangerouslySetInnerHTML={{ __html: message.text }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">В этом диалоге пока нет сообщений</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}