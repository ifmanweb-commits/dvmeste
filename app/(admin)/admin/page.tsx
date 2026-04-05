import { getDashboardStats } from "@/lib/actions/admin-dashboard";
import { ModerationCards } from "@/components/admin/dashboard/ModerationCards";
import { ProblematicLeads } from "@/components/admin/dashboard/ProblematicLeads";
import { PsychologistsStats } from "@/components/admin/dashboard/PsychologistsStats";
import { StatisticsBlock } from "@/components/admin/dashboard/StatisticsBlock";
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

          <div className="grid gap-6 md:grid-cols-2">
            {/* Блок — Психологи */}
            <PsychologistsStats data={result.stats.psychologists} students={result.stats.students} />

            {/* Статистика */}
            <StatisticsBlock data={result.stats.statistics} />
          </div>

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
        </>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-yellow-800">
          Не удалось загрузить статистику: {result.error || "Проверьте подключение к базе данных."}
        </div>
      )}
    </div>
  );
}