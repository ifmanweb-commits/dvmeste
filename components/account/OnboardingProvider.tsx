"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { usePathname } from "next/navigation"
import { OnboardingModal } from "./OnboardingModal"
import { OnboardingToast } from "./OnboardingToast"
import { dismissTip } from "@/lib/actions/onboarding"

interface Tip {
  id: string
  title: string
  message: string
  delaySeconds: number
}

interface OnboardingData {
  modal: Tip | null
  toasts: Tip[]
}

export function OnboardingProvider() {
  const pathname = usePathname()
  const [data, setData] = useState<OnboardingData>({ modal: null, toasts: [] })
  const [currentToastIndex, setCurrentToastIndex] = useState(-1)
  const [isModalClosed, setIsModalClosed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const delayTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Загружаем подсказки при монтировании и при изменении URL
  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true)
    }
    
    // Сбрасываем состояния при смене маршрута
    setCurrentToastIndex(-1)
    setIsModalClosed(false)
    
    // Очищаем таймеры
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    if (delayTimeoutRef.current) clearTimeout(delayTimeoutRef.current)
    
    const loadTips = async () => {
      try {
        const currentUrl = window.location.pathname + window.location.search
        const res = await fetch(`/api/onboarding?url=${encodeURIComponent(currentUrl)}`)
        
        if (res.ok) {
          const result = await res.json()
          setData(result)
        }
      } catch (error) {
        console.error("Error loading onboarding tips:", error)
      }
    }

    loadTips()
  }, [pathname])

  // Обработчик закрытия модального окна
  const handleModalClose = useCallback(async (tipId: string) => {
    await dismissTip(tipId)
    setIsModalClosed(true)
  }, [])

  // Обработчик закрытия тоста
  const handleToastClose = useCallback(async (tipId: string) => {
    await dismissTip(tipId)
    
    // Ждём завершения анимации скрытия (300мс) перед показом следующего тоста
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current)
    }
    
    toastTimeoutRef.current = setTimeout(() => {
      setCurrentToastIndex((prev) => prev + 1)
    }, 350) // Чуть больше длительности анимации
  }, [])

  // Показываем тосты
  useEffect(() => {
    if (data.toasts.length === 0) return

    // Если есть модальное окно - ждём его закрытия
    if (data.modal && !isModalClosed) return

    // Первый тост показываем с учётом задержки
    const firstToast = data.toasts[0]
    if (firstToast.delaySeconds > 0) {
      delayTimeoutRef.current = setTimeout(() => {
        setCurrentToastIndex(0)
      }, firstToast.delaySeconds * 1000)
    } else {
      setCurrentToastIndex(0)
    }

    return () => {
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current)
      }
    }
  }, [isModalClosed, data.toasts, data.modal])

  // Очистка таймеров при размонтировании
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
      if (delayTimeoutRef.current) clearTimeout(delayTimeoutRef.current)
    }
  }, [])

  if (!isMounted) return null

  return (
    <>
      <OnboardingModal 
        tip={data.modal} 
        onClose={handleModalClose} 
      />
      <OnboardingToast 
        toast={currentToastIndex >= 0 && currentToastIndex < data.toasts.length 
          ? data.toasts[currentToastIndex] 
          : null}
        onClose={handleToastClose}
      />
    </>
  )
}