'use client'

import { useState } from 'react'
import { User } from '@prisma/client'
import { Menu, X } from 'lucide-react'
import AccountNav from './AccountNav'
import { cn } from '@/lib/utils'

interface AccountHeaderProps {
  user: User
}

export default function AccountHeader({ user }: AccountHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      {/* Мобильный хедер - виден только на экранах меньше md */}
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        {/* Кнопка гамбургера */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Открыть меню"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Заголовок */}
        <h1 className="text-lg font-semibold text-gray-900">Личный кабинет</h1>

        {/* Пустой элемент для балансировки */}
        <div className="w-10" />
      </header>

      {/* Мобильное drawer-меню */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Затемнение фона */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Выезжающая панель */}
          <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-xl flex flex-col">
            {/* Шапка мобильного меню с кнопкой закрытия */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Меню</h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 -mr-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Закрыть меню"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Навигация */}
            <AccountNav user={user} isMobile onNavigate={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}