"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModalTip {
  id: string
  title: string
  message: string
}

interface OnboardingModalProps {
  tip: ModalTip | null
  onClose: (id: string) => void
}

export function OnboardingModal({ tip, onClose }: OnboardingModalProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (tip) {
      // Небольшая задержка для анимации появления
      const showTimer = setTimeout(() => {
        setIsVisible(true)
      }, 10)
      return () => clearTimeout(showTimer)
    } else {
      setIsVisible(false)
    }
  }, [tip])

  const handleClose = () => {
    if (!tip) return
    setIsVisible(false)
    setTimeout(() => {
      onClose(tip.id)
    }, 200)
  }

  if (!tip || !isMounted) return null

  return (
    <>
      {/* Затемнение фона */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-50 transition-opacity duration-200",
          isVisible ? "opacity-100" : "opacity-0"
        )}
        onClick={handleClose}
      />
      
      {/* Модальное окно */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div
          className={cn(
            "bg-white shadow-2xl pointer-events-auto transition-all duration-200",
            // Mobile: full-screen без полей
            "h-full w-full flex flex-col",
            // Desktop: центрированное окно с отступами
            "md:rounded-2xl md:max-w-md md:h-auto md:w-auto md:p-4",
            isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
          )}
        >
          {/* Шапка */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
            <h3 className="text-xl font-bold text-slate-900">
              {tip.title}
            </h3>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          
          {/* Контент - прокручиваемый на мобильных */}
          <div className="flex-1 overflow-y-auto p-6">
            <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
              {tip.message}
            </p>
          </div>
          
          {/* Кнопка закрытия внизу - фиксированная на мобильных */}
          <div className="px-6 pb-6 flex-shrink-0">
            <button
              onClick={handleClose}
              className="w-full py-3 px-4 bg-[#5858E2] hover:bg-[#4a4ac4] text-white rounded-lg font-medium transition-colors"
            >
              Понятно
            </button>
          </div>
        </div>
      </div>
    </>
  )
}