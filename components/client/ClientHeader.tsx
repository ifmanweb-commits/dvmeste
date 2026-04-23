'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ClientData {
  id: string
  email: string
  name: string | null
}

interface ClientHeaderProps {
  className?: string
}

export function ClientHeader({ className }: ClientHeaderProps) {
  const [client, setClient] = useState<ClientData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await fetch('/api/client/account/me')
        if (!res.ok) {
          if (res.status === 401) {
router.push('/auth/login')
            return
          }
          throw new Error('Ошибка загрузки')
        }
        const data = await res.json()
        setClient(data)
      } catch (error) {
        console.error('Error fetching client:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchClient()
  }, [router])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/catalog')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const menuItems = [
    { href: '/client/account/profile', label: 'Профиль' },
    { href: '/client/account/leads', label: 'Мои заявки' }
  ]

  if (isLoading) {
    return (
      <div className={cn(
        "border-b border-gray-200 bg-white",
        className
      )}>
        <div className="max-w-6xl mx-auto px-4 py-3 animate-pulse">
          <div className="h-6 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "border-b border-gray-200 bg-white",
      className
    )}>
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Левая часть: меню ЛК */}
        <nav className="flex items-center gap-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Правая часть: имя и кнопка выхода */}
        <div className="flex items-center gap-4">
          <span className="font-medium text-gray-900">
            {client?.name || 'Клиент'}
          </span>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-red-600 transition-colors disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Выйти</span>
          </button>
        </div>
      </div>
    </div>
  )
}