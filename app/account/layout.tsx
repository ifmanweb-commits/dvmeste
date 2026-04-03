import { getCurrentUser } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import AccountNav from '@/components/account/AccountNav'
import AccountHeader from '@/components/account/AccountHeader'
import { getBalance } from '@/lib/billing'

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
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Мобильный хедер */}
      <AccountHeader user={user} />
      
      <div className="flex">
        {/* Боковая панель - скрыта на мобильном, видна на md+ */}
        <div className="hidden md:block">
          <AccountNav user={{ ...user, balance }} />
        </div>
        
        {/* Основной контент */}
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
