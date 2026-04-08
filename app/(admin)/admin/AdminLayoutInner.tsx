'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { User } from '@prisma/client'
import { logout } from '@/lib/auth/logout';
import { LogOut } from 'lucide-react';
import { OnboardingProvider } from '@/components/account/OnboardingProvider';

interface AdminLayoutInnerProps {
  children: ReactNode
  user: User
}

export function AdminLayoutInner({ children, user }: AdminLayoutInnerProps) {
  const pathname = usePathname()
  
  const menuItems = [
    { href: '/admin', label: 'Дашборд', roles: ['admin', 'manager'] },
    { href: '/admin/messages', label: 'Сообщения', roles: ['admin', 'manager'] },
    { href: '/admin/leads', label: 'Заявки', roles: ['admin', 'manager'] },
    { href: '/admin/clients', label: 'Клиенты', roles: ['admin', 'manager'] },
    { href: '/admin/complaints', label: 'Жалобы', roles: ['admin', 'manager'] },
    { href: '/admin/psychologists', label: 'Психологи', roles: ['admin', 'manager'] },
    { href: '/admin/candidates', label: 'Кандидаты', roles: ['admin', 'manager'] },
    { href: '/admin/moderation', label: 'Модерация', roles: ['admin', 'manager'] },
    { href: '/admin/articles', label: 'Статьи', roles: ['admin', 'manager'] },
    { href: '/admin/courses', label: 'Курсы', roles: ['admin', 'manager'] },
    { href: '/admin/secret-pages', label: 'Секретные страницы', roles: ['admin', 'manager'] },
    { href: '/admin/certifications', label: 'Сертификации', roles: ['admin', 'manager'] },
    { href: '/admin/payments', label: 'Платежи', roles: ['admin'] },
    { href: '/admin/onboarding', label: 'Советы', roles: ['admin', 'manager'] },
    { href: '/admin/pages', label: 'Страницы', roles: ['admin'] },
    { href: '/admin/managers', label: 'Менеджеры', roles: ['admin'] },
    { href: '/admin/blocks', label: 'Блоки', roles: ['admin'] },
    { href: '/admin/menu', label: 'Меню', roles: ['admin'] },
    { href: '/admin/ListDate', label: 'Справочники', roles: ['admin'] },
    { href: '/admin/management', label: 'Управление', roles: ['admin'] },
  ]
  
  // Фильтруем меню по ролям
  const filteredMenu = menuItems.filter(item => {
    if (user.isAdmin) return true
    if (user.isManager && item.roles.includes('manager')) return true
    return false
  })

  // Проверяем аватарку пользователя
  const userAvatar = user.avatarUrl;
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col sticky top-0 h-screen">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-lg">Админ-панель</h2>
          <div className="flex items-center gap-3 mt-3">
            {userAvatar ? (
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-gray-200">
                <Image
                  src={userAvatar}
                  alt={user.fullName || user.email}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#5858E2] text-white font-medium">
                {(user.fullName || user.email).charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.fullName || user.email}
              </p>
              <p className="text-xs text-gray-500">
                {user.isAdmin ? 'Администратор' : 'Менеджер'}
              </p>
            </div>
          </div>
        </div>
        
        <nav className="p-2">
          <ul className="space-y-0.5">
            {filteredMenu.map((item) => {
              const isActive = pathname === item.href
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "block px-3 py-1.5 rounded-md text-sm transition-colors",
                      isActive 
                        ? "bg-blue-50 text-blue-700 font-medium" 
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
        
<button
  onClick={async () => {
    await logout();
  }}
  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 cursor-pointer transition-colors w-full text-left border-t border-gray-200 mt-auto"
>
  <LogOut size={16} />
  <span>Выход</span>
</button>
      </aside>
      
      {/* СПРАВА: Рабочая область */}
            <main className="flex-1 flex flex-col min-w-0">
              <div className="p-2 sm:p-2 lg:p-2 flex-1 flex flex-col">
                
                {/* ТА САМАЯ БЕЛАЯ ПЛАШКА */}
                <div className="flex-1 bg-white border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col relative">
                  
                  {/* Прямые углы обеспечиваются отсутствием rounded-классов */}
                  <div className="flex-1 p-10 lg:p-10">
                    {children}
                  </div>

                </div>

              </div>
            </main>
            
            {/* Провайдер обучающих подсказок */}
            <OnboardingProvider />
          </div>
  )
}
