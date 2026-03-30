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
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Ошибка при загрузке данных дашборда
        </div>
      </div>
    );
  }

  const isPublished = publishStatusResult.isPublished ?? false;
  const status = publishStatusResult.status ?? user.status;

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Дашборд</h1>
        <p className="text-gray-600">Обзор вашей активности на платформе</p>
      </header>

      <DashboardClient
        data={dashboardResult.data}
        isPublished={isPublished}
        status={status}
        certificationLevel={user.certificationLevel}
      />
    </div>
  );
}