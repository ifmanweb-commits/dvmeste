'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    ymaps3?: {
      ready: (callback: () => void) => void
      smartcaptcha?: {
        SmartCaptcha: new (container: HTMLElement, options: SmartCaptchaOptions) => SmartCaptchaInstance
      }
    }
  }
}

interface SmartCaptchaOptions {
  sitekey: string
  callback: (token: string) => void
  'error-callback'?: (error: string) => void
  'expired-callback'?: () => void
  lang?: 'ru' | 'en'
  theme?: 'light' | 'dark'
}

interface SmartCaptchaInstance {
  destroy: () => void
  reset: () => void
  getToken: () => Promise<string>
}

interface SmartCaptchaProps {
  sitekey: string
  onVerify: (token: string) => void
  onError?: (error: string) => void
  onExpire?: () => void
  className?: string
}

export default function SmartCaptcha({
  sitekey,
  onVerify,
  onError,
  onExpire,
  className = ''
}: SmartCaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const captchaRef = useRef<SmartCaptchaInstance | null>(null)
  const scriptLoadedRef = useRef(false)

  useEffect(() => {
    if (scriptLoadedRef.current) return

    const script = document.createElement('script')
    script.src = 'https://smartcaptcha.yandexcloud.net/sdk/iframe?fallback=error'
    script.async = true
    script.onload = () => {
      scriptLoadedRef.current = true
      initCaptcha()
    }
    script.onerror = () => {
      onError?.('Не удалось загрузить скрипт капчи')
    }

    document.head.appendChild(script)

    return () => {
      if (containerRef.current && captchaRef.current) {
        captchaRef.current.destroy()
      }
    }
  }, [])

  const initCaptcha = () => {
    if (!containerRef.current || !window.ymaps3?.smartcaptcha) return

    captchaRef.current = new window.ymaps3.smartcaptcha.SmartCaptcha(containerRef.current, {
      sitekey,
      lang: 'ru',
      theme: 'light',
      callback: (token: string) => {
        onVerify(token)
      },
      'error-callback': (error: string) => {
        onError?.(error)
      },
      'expired-callback': () => {
        onExpire?.()
      }
    })
  }

  return (
    <div
      ref={containerRef}
      className={`smartcaptcha-container ${className}`}
      style={{ minHeight: '64px' }}
    />
  )
}