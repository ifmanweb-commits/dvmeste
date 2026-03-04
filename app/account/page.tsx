import { getCurrentUser } from '@/lib/auth/session'
import { redirect } from 'next/navigation'

export default async function AccountPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
 

  
  // Для пользователей с заполненным профилем (CANDIDATE, ACTIVE и т.д.)
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Личный кабинет</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Добро пожаловать, {user.fullName || user.email}!
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-semibold mb-2">📊 Статус</h3>
            <p className="text-gray-600">
              {user.status === "CANDIDATE" && "Кандидат (заполните анкету)"}
              {user.status === "ACTIVE" && "Активный психолог"}
              {user.status === "REJECTED" && "Заявка отклонена"}
              {user.status === "BLOCKED" && "Заблокирован"}
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-semibold mb-2">🎯 Следующий шаг</h3>
            <p className="text-gray-600">
              {user.status === "CANDIDATE" && "Заполните анкету для вступления в каталог"}
              {user.status === "ACTIVE" && "Напишите статью"}
              {(user.status === "REJECTED" || user.status === "BLOCKED") && "Обратитесь в поддержку"}
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded md:col-span-2">
            <h3 className="font-semibold mb-2">📝 Информация</h3>
            <p className="text-gray-600">
              Email: {user.email}<br />
              Уровень сертификации: {user.certificationLevel === 0 ? 'Нет' : `Уровень ${user.certificationLevel}`}<br />
              Публикация: {user.isPublished ? "✅ Опубликован" : "⏳ Не опубликован"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}