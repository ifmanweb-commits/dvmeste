import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getManagersList } from '@/lib/actions/admin-managers';
import { ManagersTable } from '@/components/admin/ManagersTable';
import { ManagerSearchForm } from '@/components/admin/ManagerSearchForm';

export default async function ManagersPage() {
  const user = await getCurrentUser();
  
  // Проверяем, что текущий пользователь - админ
  if (!user?.isAdmin) {
    redirect('/admin');
  }

  const managers = await getManagersList();

  return (
    <div className="">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Управление менеджерами</h1>
        <p className="text-gray-500 mt-1">Добавление и настройка менеджеров</p>
      </div>

      <ManagerSearchForm />
      
      <div className="mt-6">
        <ManagersTable managers={managers} currentUserId={user.id} isSuperAdmin={user.isSuperAdmin} />
      </div>
    </div>
  );
}
