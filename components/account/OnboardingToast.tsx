"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Toast {
  id: string
  title: string
  message: string
  delaySeconds: number
}

interface OnboardingToastProps {
  toast: Toast | null
  onClose: (id: string) => void
}

export function OnboardingToast({ toast, onClose }: OnboardingToastProps) {
  const [isLeaving, setIsLeaving] = useState(false)

  // Сбрасываем isLeaving при смене тоста
  useEffect(() => {
    if (toast) {
      setIsLeaving(false)
    }
  }, [toast])

  const handleClose = () => {
    if (!toast) return
    // Запускаем анимацию ухода
    setIsLeaving(true)
    // Вызываем onClose после завершения анимации
    setTimeout(() => {
      onClose(toast.id)
    }, 300) // Длительность анимации
  }

  // Если нет тоста - не рендерим ничего
  if (!toast) return null

  return (
    <div
      className={cn(
        "fixed bottom-5 right-5 z-50 w-80 max-w-[90vw] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden transition-all duration-300 ease-out",
        isLeaving ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"
      )}
    >
      {/* Заголовок с зелёным фоном и кнопкой закрытия */}
      <div className="bg-green-50/80 px-4 py-2 border-b border-green-100 flex items-center justify-between">
        <h4 className="font-semibold text-green-900 text-sm">
          {toast.title}
        </h4>
        <button
          onClick={handleClose}
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full hover:bg-green-100 transition-colors"
        >
          <X className="w-3.5 h-3.5 text-green-700" />
        </button>
      </div>
      
      {/* Основной текст */}
      <div className="p-4">
        <p className="text-sm text-slate-600 whitespace-pre-wrap">
          {toast.message}
        </p>
      </div>
    </div>
  )
}
