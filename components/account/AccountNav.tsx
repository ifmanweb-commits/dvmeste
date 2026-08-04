'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User } from '@prisma/client'
import LogoutButton from '@/components/LogoutButton'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import {
  Home,
  User as UserIcon,
  FileText,
  Award,
  MessageCircleIcon,
  Settings,
  LogOut,
  ClipboardList,
  CheckCircle,
  Bell,
  Radio,
  Users,
  Eye,
  ShieldCheck,
  GraduationCap,
  Wallet,
  BookOpen,
  KeyRound
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PsychologistSiteMenu } from '@/components/layout/PsychologistSiteMenu'
import { SiteMenuItem } from '@/lib/site-menu'
import { LucideIcon } from 'lucide-react'

interface NavMenuItem {
  href: string
  label: string
  icon: LucideIcon
  show: boolean
}

interface AccountNavProps {
  user: User & { balance?: number }
  isMobile?: boolean
  onNavigate?: () => void
  menuItems?: SiteMenuItem[]
}

export default function AccountNav({ user, isMobile, onNavigate, menuItems: siteMenuItems = [] }: AccountNavProps) {
  const pathname = usePathname()
  const [balance, setBalance] = useState<number>(user.balance ?? 0)

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await fetch('/api/account/balance')
        if (res.ok) {
          const data = await res.json()
          setBalance(data.balance)
        }
      } catch (err) {
        console.error('Ошибка получения баланса:', err)
      }
    }
    fetchBalance()
  }, [])

  const formatBalance = (amount: number): string => {
    const rubles = Math.round(amount / 100)
    return rubles.toLocaleString('ru-RU')
  }
  
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/auth/login'
  }
  
  // Базовые пункты меню для всех
  const navMenuItems: NavMenuItem[] = [
    {
      href: '/account',
      label: 'Личный кабинет',
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
      href: '/account/leads',
      label: 'Заявки',
      icon: Users,
      show: user.status === 'ACTIVE' || user.status === 'CANDIDATE' // Только для активных психологов
    },
    {
      href: '/account/articles',
      label: 'Мои статьи',
      icon: FileText,
      show: user.status !== 'PENDING' // Только для кандидатов и активных
    },
    // ВРЕМЕННО СКРЫТО — разделы в разработке
    // {
    //   href: '/account/certification',
    //   label: 'Сертификация',
    //   icon: Award,
    //   show: user.status === 'ACTIVE' || user.status === 'CANDIDATE'
    // },
    // {
    //   href: '/account/key-active',
    //   label: 'Ключи',
    //   icon: KeyRound,
    //   show: user.status === 'ACTIVE' || user.status === 'CANDIDATE'
    // },
    // {
    //   href: '/account/supervision',
    //   label: 'Супервизия',
    //   icon: ShieldCheck,
    //   show: user.isSupervisor === true
    // },
    {
      href: '/account/notifications',
      label: 'Уведомления',
      icon: Bell,
      show: true // Доступ у всех статусов
    },
    {
      href: '/account/tips',
      label: 'Подсказки',
      icon: BookOpen,
      show: true // Доступ у всех статусов
    },
    {
      href: '/account/messages',
      label: 'Служба заботы',
      icon: MessageCircleIcon,
      show: user.status !== 'BLOCKED' // Только для кандидатов и активных
    }
  ]
  
  // Фильтруем пункты по статусу
  const visibleItems = navMenuItems.filter(item => item.show)
  
  return (
    <aside className={cn(
      "w-64 bg-white h-full flex flex-col",
      isMobile ? "border-b border-gray-200" : ""
    )}>
      {/* Шапка с информацией о пользователе */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          {siteMenuItems.length > 0 && (
            <PsychologistSiteMenu menuItems={siteMenuItems} />
          )}
          <h2 className="font-semibold text-lg">Кабинет психолога</h2>
        </div>
        <div className="flex items-center space-x-3">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.fullName || 'Аватар'}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-semibold">
                {user.fullName?.[0] || user.email[0].toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {user.fullName || 'Пользователь'}
            </p>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
        
        {/* ВРЕМЕННО СКРЫТО — раздел в разработке */}
        {/* <Link
          href="/account/balance"
          className="mt-3 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
        >
          <div className="flex items-center">
            <Wallet className="mr-2 h-4 w-4 text-gray-500" />
            <span>Баланс</span>
          </div>
          <span className="text-gray-900">{formatBalance(balance)} ₽</span>
        </Link> */}
        
        {/* Статус пользователя */}
        <div className="mt-3 flex flex-wrap gap-2">
          {/* Бейдж статуса аккаунта */}
          <span className={cn(
            "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
            user.status === 'ACTIVE' && "bg-green-100 text-green-800",
            user.status === 'CANDIDATE' && "bg-yellow-100 text-yellow-800",
            user.status === 'PENDING' && "bg-gray-100 text-gray-800",
            user.status === 'REJECTED' && "bg-red-100 text-red-800",
            user.status === 'BLOCKED' && "bg-red-100 text-red-800"
          )}>
            {user.status === 'ACTIVE' && <ShieldCheck className="w-3 h-3 mr-1" />}
            {user.status === 'ACTIVE' && 'Проверен'}
            {user.status === 'CANDIDATE' && 'Не проверен'}
            {user.status === 'PENDING' && 'Ожидает'}
            {user.status === 'REJECTED' && 'Отклонен'}
            {user.status === 'BLOCKED' && 'Заблокирован'}
          </span>
          
          {/* Бейдж "В каталоге" - только для ACTIVE с isPublished */}
          {user.status === 'ACTIVE' && user.isPublished && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              <Eye className="w-3 h-3 mr-1" />
              В каталоге
            </span>
          )}
          
          {/* Бейдж уровня сертификации */}
          {user.certificationLevel > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <Award className="w-3 h-3 mr-1" />
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
                  onClick={onNavigate}
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
        {/* Разделитель */}
        <div className="my-2 border-t border-gray-200"></div>
        
        {/* Кнопка выхода - в стиле пунктов меню */}
        <button
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' })
            window.location.href = '/auth/login'
          }}
          className="flex items-center w-full px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5 mr-3 text-gray-500" />
          Выйти
        </button>
      </nav>
      
      
    </aside>
  )
}