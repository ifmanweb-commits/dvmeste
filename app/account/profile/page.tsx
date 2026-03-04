import { notFound, redirect } from "next/navigation";
import { ProfileForm } from "@/components/account/ProfileForm";
import { getCurrentUser } from '@/lib/auth/session'

export default async function ProfilePage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Если нет пользователя — 404
  if (!user?.id) {
    console.log("Нет пользователя");
    notFound();
  }

  const isActive = user.status === "ACTIVE";
  const isCandidate = user.status === "CANDIDATE";

  // Подготовим данные для формы
  const initialData = {
    id: user.id, // добавили id
    fullName: user.fullName || '',
    price: user.price || 0,
    contactInfo: user.contactInfo || '',
    status: user.status,
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Личный кабинет</h1>
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h2 className="text-2xl font-semibold mb-6">Профиль</h2>
        
        {isCandidate && (
          <ProfileForm 
            initialData={initialData} 
            userId={user.id}
          />
        )}

        {isActive && (
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-yellow-50">
              <p className="text-yellow-800">
                Ваш профиль опубликован. Для изменений обратитесь к менеджеру.
              </p>
            </div>
            <div className="grid gap-4">
              <div>
                <p className="text-sm text-gray-600">Имя</p>
                <p className="font-medium">{user.fullName || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Цена</p>
                <p className="font-medium">{user.price || 0} ₽</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Контакты</p>
                <p className="font-medium">{user.contactInfo || "—"}</p>
              </div>
            </div>
          </div>
        )}

        {!isCandidate && !isActive && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <p className="text-gray-600">
              {user.status === 'PENDING' && 'Подтвердите email, чтобы заполнить профиль'}
              {user.status === 'REJECTED' && 'Ваша заявка отклонена. Обратитесь к менеджеру'}
              {user.status === 'BLOCKED' && 'Профиль заблокирован'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}