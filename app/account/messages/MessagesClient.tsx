// app/account/messages/MessagesClient.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { 
  sendMessage, 
  getMessages, 
  getUnreadCount,
  getOrCreateDialog 
} from "@/lib/actions/messages"
import { MessageForm } from "./MessageForm"
import { MessageList } from "./MessageList"
import { Loader2 } from "lucide-react"

type Message = {
  id: string
  dialogId: string
  direction: "to_moder" | "to_user"
  text: string
  isRead: boolean
  createdAt: Date
}

type DialogInfo = {
  id: string
  status: 'ACTIVE' | 'WAITING' | 'ARCHIVED'
  lastMessageAt: Date
}

type MessagesData = {
  messages: Message[]
  total: number
  page: number
  limit: number
  hasMore: boolean
  dialog: DialogInfo | null
}

export function MessagesClient() {
  const [messagesData, setMessagesData] = useState<MessagesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Загрузка сообщений при монтировании
  useEffect(() => {
    initializeMessages()
  }, [])

  const initializeMessages = async () => {
    setLoading(true)
    
    try {
      // 1. Получаем или создаем диалог
      const dialogResult = await getOrCreateDialog()
      if (!dialogResult.success) {
        setError(dialogResult.error || "Ошибка при создании диалога")
        setLoading(false)
        return
      }

      // 2. Загружаем сообщения
      await loadMessages(1)
      
      // 3. Загружаем счетчик непрочитанных
      await loadUnreadCount()
    } catch (err) {
      setError("Ошибка при загрузке")
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (page = 1) => {
    if (page === 1) setLoading(true)
    else setLoadingMore(true)
    
    try {
      const result = await getMessages(page, 20)
      
      if (result.success && result.data) {
        // Приводим direction к правильному типу
        const typedMessages = result.data.messages.map(msg => ({
          ...msg,
          direction: msg.direction as "to_moder" | "to_user"
        }))

        const typedData = {
          ...result.data,
          messages: typedMessages
        }
        
        if (page === 1) {
          setMessagesData(typedData)
        } else {
          setMessagesData(prev => {
            if (!prev) return typedData
            return {
              ...typedData,
              messages: [...prev.messages, ...typedMessages]
            }
          })
        }
      } else {
        setError(result.error || "Ошибка загрузки сообщений")
      }
    } catch (err) {
      setError("Ошибка при загрузке")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadUnreadCount = async () => {
    const result = await getUnreadCount()
    if (result.success) {
      setUnreadCount(result.count)
    }
  }

// В MessagesClient.tsx, обновим handleSendMessage

  const handleSendMessage = async (text: string) => {
    setSending(true)
    setError(null)

    // Создаем временное сообщение для мгновенного отображения
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      dialogId: messagesData?.dialog?.id || '', // нужен dialogId
      direction: "to_moder", // пользователь -> модератору
      text: text,
      isRead: false,
      createdAt: new Date()
    }

    // Добавляем в список сразу
    if (messagesData) {
      setMessagesData({
        ...messagesData,
        messages: [tempMessage, ...messagesData.messages]
      })
    }
    
    try {
      const result = await sendMessage(text)
      
      if (result.success) {
        // При успехе перезагружаем с сервера, чтобы получить реальные ID
        await loadMessages(1)
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: "smooth" })
        }, 100)
      } else {
        // При ошибке удаляем временное сообщение
        if (messagesData) {
          setMessagesData({
            ...messagesData,
            messages: messagesData.messages.filter(msg => msg.id !== tempMessage.id)
          })
        }
        setError(result.error || "Ошибка отправки")
      }
    } catch (err) {
      // При ошибке удаляем временное сообщение
      if (messagesData) {
        setMessagesData({
          ...messagesData,
          messages: messagesData.messages.filter(msg => msg.id !== tempMessage.id)
        })
      }
      setError("Ошибка при отправке")
    } finally {
      setSending(false)
    }
  }

  const handleLoadMore = () => {
    if (messagesData && messagesData.hasMore) {
      loadMessages(messagesData.page + 1)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#5858E2]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {unreadCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
          У вас {unreadCount} {unreadCount === 1 ? "непрочитанное сообщение" : "непрочитанных сообщений"}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <MessageForm onSend={handleSendMessage} sending={sending} />

      {messagesData && messagesData.messages.length > 0 ? (
        <MessageList 
          messages={messagesData.messages}
          hasMore={messagesData.hasMore}
          onLoadMore={handleLoadMore}
          loadingMore={loadingMore}
        />
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <p className="text-gray-500">У вас пока нет сообщений</p>
          <p className="text-sm text-gray-400 mt-1">
            Напишите модераторам — они ответят в ближайшее время
          </p>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}