import { getCurrentUser } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import AccountNav from '@/components/account/AccountNav'

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
  
  return (
    <div className="flex">
      <AccountNav user={user} /> {/* навигация получает user */}
      <main className="flex-1 p-8">
        {children} {/* page.tsx НЕ получает user автоматически */}
      </main>
    </div>
  )
}