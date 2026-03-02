import { getManagersList } from "@/lib/actions/admin-managers";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ManagersTable } from "@/components/admin/ManagersTable";
import { UserSearch } from "@/components/admin/UserSearch";

export default async function ManagersPage() {
  const session = await getServerSession();
  
  // Проверяем, что текущий пользователь - админ
  if (!session?.user?.email) {
    redirect("/auth/login");
  }

  // Получаем список менеджеров и админов
  const managers = await getManagersList();
  
  // Находим ID текущего пользователя
  const currentUser = managers.find(m => m.email === session.user?.email);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Управление командой</h1>
        <p className="text-sm text-gray-600 mt-1">
          Добавляйте и удаляйте администраторов и менеджеров проекта
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <UserSearch />
        </div>
        
        <div className="md:col-span-2">
          <ManagersTable 
            managers={managers} 
            currentUserId={currentUser?.id}
          />
        </div>
      </div>
    </div>
  );
}