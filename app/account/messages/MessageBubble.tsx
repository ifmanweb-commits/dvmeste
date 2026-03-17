// app/account/messages/MessageBubble.tsx
"use client"

import { User, Bot } from "lucide-react"

interface MessageBubbleProps {
  message: any
  direction: "to_moder" | "to_user"
  timestamp: string
}

export function MessageBubble({ message, direction, timestamp }: MessageBubbleProps) {
  const isFromUser = direction === "to_moder"

  return (
    <div className={`max-w-[80%] ${isFromUser ? "ml-auto" : "mr-auto"}`}>
      <div className="flex items-start gap-2">
        {/* Аватар для сообщений модератора */}
        {!isFromUser && (
          <div className="w-8 h-8 rounded-full bg-[#5858E2]/10 flex items-center justify-center flex-shrink-0 mt-1">
            <Bot className="h-4 w-4 text-[#5858E2]" />
          </div>
        )}

        {/* Контент сообщения */}
        <div
          className={`rounded-xl p-3 ${
            isFromUser
              ? "bg-[#5858E2] text-white rounded-tr-none"
              : "bg-gray-100 text-gray-900 rounded-tl-none"
          }`}
        >
          {/* Текст с pre-wrap и ссылками */}
          <div
            className="text-sm whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: message.text }}
          />

          {/* Время и статус */}
          <div
            className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${
              isFromUser ? "text-white/70" : "text-gray-500"
            }`}
          >
            {timestamp}
          </div>
        </div>

        {/* Аватар для сообщений пользователя */}
        {isFromUser && (
          <div className="w-8 h-8 rounded-full bg-[#5858E2] flex items-center justify-center flex-shrink-0 mt-1">
            <User className="h-4 w-4 text-white" />
          </div>
        )}
      </div>
    </div>
  )
}