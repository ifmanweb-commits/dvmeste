import { ReactNode } from 'react'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { ClientHeader } from '@/components/client/ClientHeader'

interface ClientLayoutProps {
  children: ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Секция 1: Главная шапка сайта */}
      <SiteHeader />

      {/* Секция 2: Шапка ЛК с меню, именем и кнопкой выхода */}
      <ClientHeader />

      {/* Секция 3: Контент страницы */}
      <main className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}