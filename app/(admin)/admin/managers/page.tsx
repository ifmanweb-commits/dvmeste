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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Управление менеджерами</h1>
      </div>

      <ManagerSearchForm />
      
      <ManagersTable managers={managers} currentUserId={user.id} isSuperAdmin={user.isSuperAdmin} />
    </div>
  );
}
