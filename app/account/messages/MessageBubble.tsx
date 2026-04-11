// app/account/messages/MessageBubble.tsx
"use client"

import { User, Bot } from "lucide-react"

interface MessageBubbleProps {
  message: any
  direction: "to_moder" | "to_user"
  timestamp: string
  userAvatar?: string | null
}

export function MessageBubble({ message, direction, timestamp, userAvatar }: MessageBubbleProps) {
  const isFromUser = direction === "to_moder"

  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      {/* Аватар */}
      <div className="flex-shrink-0">
        {isFromUser ? (
          userAvatar ? (
            <img 
              src={userAvatar} 
              alt="Avatar" 
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="h-5 w-5 text-gray-500" />
            </div>
          )
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#5858E2]/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-[#5858E2]" />
          </div>
        )}
      </div>

      {/* Контент */}
      <div className="flex-1 min-w-0">
        {/* Имя отправителя */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-semibold text-gray-900 text-sm">
            {isFromUser ? "Вы" : "Модератор"}
          </span>
          <span className="text-xs text-gray-500">{timestamp}</span>
        </div>

        {/* Текст сообщения */}
        <div
          className="text-sm text-gray-700 whitespace-pre-wrap break-words"
          dangerouslySetInnerHTML={{ __html: message.text }}
        />
      </div>
    </div>
  )
}