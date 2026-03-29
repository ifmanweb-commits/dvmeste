import { getDashboardStats } from "@/lib/actions/admin-dashboard";
import { ModerationCards } from "@/components/admin/dashboard/ModerationCards";
import { ProblematicLeads } from "@/components/admin/dashboard/ProblematicLeads";
import { ArticleDebts } from "@/components/admin/dashboard/ArticleDebts";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function AdminPage() {
  const result = await getDashboardStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Панель управления</h1>
      </div>

      {result.success && result.stats ? (
        <>
          {/* Красный блок — Срочно на модерацию */}
          <ModerationCards data={result.stats.moderation} />

          {/* Синий блок — Проблемные заявки */}
          <ProblematicLeads data={result.stats.problematicLeads} />

          {/* Оранжевый блок — Долги по статьям */}
          <ArticleDebts data={result.stats.articleDebts} />

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
                  <span>👥 Кандидаты</span>
                  <ArrowRight className="w-4 h-4 text-gray-500" />
                </Link>
              </div>
            </div>

            {/* Статистика */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Статистика</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">На модерации:</span>
                  <span className="text-2xl font-bold text-red-600">
                    {result.stats.moderation.profiles + result.stats.moderation.documents + result.stats.moderation.photos + result.stats.moderation.articles}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Проблемные заявки:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {result.stats.problematicLeads.noResponseOver2Days + result.stats.problematicLeads.noProgressOver10Days}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Долги по статьям:</span>
                  <span className="text-2xl font-bold text-orange-600">
                    {result.stats.articleDebts.overdue.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-yellow-800">
          Не удалось загрузить статистику: {result.error || "Проверьте подключение к базе данных."}
        </div>
      )}
    </div>
  );
}