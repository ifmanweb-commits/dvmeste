import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getManagersList } from '@/lib/actions/admin-managers';
import { ManagersTable } from '@/components/admin/ManagersTable';
import { AddManagerForm } from '@/components/admin/AddManagerForm';

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

      <AddManagerForm />
      
      <ManagersTable managers={managers} />
    </div>
  );
}