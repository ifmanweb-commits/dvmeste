// app/account/messages/MessageForm.tsx
"use client"

import { useState, FormEvent } from "react"
import { Send } from "lucide-react"

interface MessageFormProps {
  onSend: (text: string) => Promise<void>
  sending: boolean
}

export function MessageForm({ onSend, sending }: MessageFormProps) {
  const [text, setText] = useState("")

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim() || sending) return
    
    await onSend(text.trim())
    setText("")
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Напишите сообщение модераторам..."
          rows={4}
          disabled={sending}
          className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5858E2] focus:border-transparent resize-none disabled:bg-gray-50 disabled:text-gray-500"
        />
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="inline-flex items-center gap-2 px-6 py-2 bg-[#5858E2] text-white rounded-lg text-sm font-medium hover:bg-[#4b4bcf] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <>Отправка...</>
            ) : (
              <>
                Отправить
                <Send className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}