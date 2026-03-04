'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

interface LogoutButtonProps {
  className?: string
  variant?: 'default' | 'icon' | 'text'
}

export default function LogoutButton({ 
  className = '',
  variant = 'default' 
}: LogoutButtonProps) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (res.ok) {
        // Редирект на страницу входа
        router.push('/auth/login')
        // Обновляем кеш, чтобы middleware сработал
        router.refresh()
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleLogout}
        className={`p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors ${className}`}
        title="Выйти"
      >
        <LogOut className="w-5 h-5" />
      </button>
    )
  }

  if (variant === 'text') {
    return (
      <button
        onClick={handleLogout}
        className={`text-sm text-gray-600 hover:text-red-600 transition-colors ${className}`}
      >
        Выйти
      </button>
    )
  }

  // Default - кнопка с иконкой и текстом
  return (
    <button
      onClick={handleLogout}
      className={`flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors ${className}`}
    >
      <LogOut className="w-4 h-4 mr-2" />
      Выйти
    </button>
  )
}