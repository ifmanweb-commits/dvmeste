'use client'

import { useEffect } from 'react'

/**
 * Клиентский компонент для перехвата fetch запросов
 * и добавления CSRF токена в заголовки
 */
export default function CsrfTokenHandler() {
  useEffect(() => {
    // Сохраняем оригинальный fetch
    const originalFetch = window.fetch

    // Функция получения CSRF токена из cookie
    const getCsrfTokenFromCookie = (): string | null => {
      const match = document.cookie.match(/csrf_token=([^;]+)/)
      return match?.[1] || null
    }

    // Переопределяем fetch
    window.fetch = async function(url: string | URL | Request, options?: RequestInit) {
      // Определяем метод запроса
      const method = (options?.method || 'GET').toUpperCase()
      
      // Добавляем токен только для mutating методов
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        // Сначала пробуем из cookie (там всегда актуальный токен)
        let csrfToken = getCsrfTokenFromCookie()
        
        // Если нет в cookie, пробуем из meta tag (для первого запроса)
        if (!csrfToken) {
          const metaTag = document.querySelector('meta[name="csrf-token"]')
          csrfToken = metaTag?.getAttribute('content') || null
        }
        
        if (csrfToken) {
          options = options || {}
          options.headers = {
            ...(options.headers || {}),
            'X-CSRF-Token': csrfToken
          } as HeadersInit
        }
      }
      
      return originalFetch.call(window, url, options)
    }

    // Возвращаем оригинальный fetch при размонтировании
    return () => {
      window.fetch = originalFetch
    }
  }, [])

  return null
}
