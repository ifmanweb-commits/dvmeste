'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User } from '@prisma/client'
import LogoutButton from '@/components/LogoutButton'
import { 
  Home, 
  User as UserIcon, 
  FileText, 
  Award,
  MessageCircleIcon,
  Settings, 
  LogOut,
  ClipboardList,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AccountNavProps {
  user: User
}

export default function AccountNav({ user }: AccountNavProps) {
  const pathname = usePathname()
  
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/auth/login'
  }
  
  // Базовые пункты меню для всех
  const menuItems = [
    {
      href: '/account',
      label: 'Дашборд',
      icon: Home,
      show: true
    },
    {
      href: '/account/profile',
      label: 'Профиль',
      icon: UserIcon,
      show: true
    },
    {
      href: '/account/articles',
      label: 'Мои статьи',
      icon: FileText,
      show: user.status !== 'PENDING' // Только для кандидатов и активных
    },
    {
      href: '/account/messages',
      label: 'Служба заботы',
      icon: MessageCircleIcon,
      show: user.status !== 'BLOCKED' // Только для кандидатов и активных
    },
    {
      href: '/account/certification',
      label: 'Сертификация',
      icon: Award,
      show: user.status === 'ACTIVE' || user.status === 'CANDIDATE'
    }
  ]
  
  // Фильтруем пункты по статусу
  const visibleItems = menuItems.filter(item => item.show)
  
  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      {/* Шапка с информацией о пользователе */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-semibold">
              {user.fullName?.[0] || user.email[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {user.fullName || 'Пользователь'}
            </p>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
        
        {/* Статус пользователя */}
        <div className="mt-3 flex items-center">
          <span className={cn(
            "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
            user.status === 'ACTIVE' && "bg-green-100 text-green-800",
            user.status === 'CANDIDATE' && "bg-yellow-100 text-yellow-800",
            user.status === 'PENDING' && "bg-gray-100 text-gray-800",
            user.status === 'REJECTED' && "bg-red-100 text-red-800",
            user.status === 'BLOCKED' && "bg-red-100 text-red-800"
          )}>
            {user.status === 'ACTIVE' && <CheckCircle className="w-3 h-3 mr-1" />}
            {user.status === 'ACTIVE' && 'В каталоге'}
            {user.status === 'CANDIDATE' && 'Кандидат'}
            {user.status === 'PENDING' && 'Ожидает'}
            {user.status === 'REJECTED' && 'Отклонен'}
            {user.status === 'BLOCKED' && 'Заблокирован'}
          </span>
          
          {user.certificationLevel > 0 && (
            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              Ур. {user.certificationLevel}
            </span>
          )}
        </div>
      </div>
      
      {/* Навигация */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-blue-50 text-blue-700" 
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Icon className={cn(
                    "w-5 h-5 mr-3",
                    isActive ? "text-blue-700" : "text-gray-500"
                  )} />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
        {/* Кнопка выхода */}
        <div className="p-4 border-t border-gray-200">
          <LogoutButton className="cursor-pointer"/>
        </div>
      </nav>
      
      
    </aside>
  )
}