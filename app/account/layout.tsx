import { getCurrentUser } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import AccountNav from '@/components/account/AccountNav'
import AccountHeader from '@/components/account/AccountHeader'
import { getBalance } from '@/lib/billing'
import { OnboardingProvider } from '@/components/account/OnboardingProvider'
import { getSiteMenuItems } from '@/lib/site-menu'

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  // Проверяем статус
  if (user.status === 'PENDING') {
    redirect('/auth/verify-email')
  }
  
  // Получаем баланс пользователя
  const balance = await getBalance(user.id)
  
  // Получаем элементы меню сайта
  const menuItems = await getSiteMenuItems()
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Мобильный хедер */}
      <AccountHeader user={user} />
      
      {/* Grid layout для десктопа */}
      <div className="grid grid-cols-[256px_1fr] min-h-screen">
        {/* Боковая панель - скрыта на мобильном, видна на md+ */}
        <aside className="hidden md:block border-r border-gray-200 bg-white">
          <AccountNav user={{ ...user, balance }} menuItems={menuItems} />
        </aside>
        
        {/* Основной контент */}
        <main className="p-4 md:p-8">
          {children}
        </main>
      </div>
      
      {/* Провайдер обучающих подсказок */}
      <OnboardingProvider />
    </div>
  )
}