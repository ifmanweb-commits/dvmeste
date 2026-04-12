import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getDashboardData, getPsychologistPublishStatus } from "@/lib/actions/account-dashboard";
import DashboardClient from "@/components/account/DashboardClient";

export default async function AccountDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Получаем данные дашборда
  const dashboardResult = await getDashboardData(user.id);
  const publishStatusResult = await getPsychologistPublishStatus(user.id);

  if (!dashboardResult.success || !dashboardResult.data) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            Ошибка при загрузке данных дашборда
          </div>
        </div>
      </div>
    );
  }

  const isPublished = publishStatusResult.isPublished ?? false;
  const status = publishStatusResult.status ?? user.status;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Личный кабинет</h1>
        </header>

        <DashboardClient
          data={dashboardResult.data}
          isPublished={isPublished}
          status={status}
          certificationLevel={user.certificationLevel}
        />
      </div>
    </div>
  );
}
