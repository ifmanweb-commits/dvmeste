import { getAdminStats } from "@/lib/actions/admin-stats";
import { DashboardCards } from "@/components/admin/DashboardCards";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function AdminPage() {
  const stats = await getAdminStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Панель управления</h1>
        <p className="mt-2 text-gray-600">
          Добро пожаловать в админ-панель. Здесь вы можете управлять контентом сайта.
        </p>
      </div>

      {stats ? (
        <>
          <DashboardCards stats={stats} />

          <div className="grid gap-6 md:grid-cols-2">
            {/* Быстрые ссылки на разделы */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Быстрые действия</h2>
              <div className="space-y-3">
                <Link 
                  href="/admin/psychologists/new"
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span>➕ Добавить нового психолога</span>
                  <ArrowRight className="w-4 h-4 text-gray-500" />
                </Link>
                <Link 
                  href="/admin/articles/new"
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span>📝 Написать новую статью</span>
                  <ArrowRight className="w-4 h-4 text-gray-500" />
                </Link>
                <Link 
                  href="/admin/candidates"
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span>👥 Кандидаты ({stats.psychologists.candidate})</span>
                  <ArrowRight className="w-4 h-4 text-gray-500" />
                </Link>
              </div>
            </div>

            {/* Активность за неделю */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Активность за неделю</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Новых психологов:</span>
                  <span className="text-2xl font-bold text-[#5858E2]">
                    {stats.activity.newPsychologists}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Новых статей:</span>
                  <span className="text-2xl font-bold text-[#5858E2]">
                    {stats.activity.newArticles}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-yellow-800">
          Не удалось загрузить статистику. Проверьте подключение к базе данных.
        </div>
      )}
    </div>
  );
}