import { requireAdmin } from "@/lib/auth/require";
import { getAdminLeads, getLeadStats } from "@/lib/actions/leads";
import { LeadsTable } from "./components/LeadsTable";
import { LeadFilters } from "./components/LeadFilters";
import { LeadStatsWidget } from "./components/LeadStatsWidget";
import { LeadStatus } from "@prisma/client";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: LeadStatus;
    resolution?: string;
    dateFrom?: string;
    dateTo?: string;
    sort?: "asc" | "desc";
  }>;
}

export default async function AdminLeadsPage({ searchParams }: PageProps) {
  await requireAdmin();

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const sort = params.sort === "asc" ? "asc" : "desc";

  // Получаем статистику
  const statsResult = await getLeadStats();
  const stats = statsResult.success ? statsResult.stats : undefined;

  // Получаем заявки с фильтрами
  const result = await getAdminLeads({
    page,
    limit: 50,
    search: params.search,
    status: params.status as LeadStatus | undefined,
    resolution: params.resolution as any,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    sort,
  });

  if (!result.success || !result.data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Ошибка загрузки заявок: {result.error}
        </div>
      </div>
    );
  }

  const { leads, pagination } = result.data;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Заявки клиентов</h1>
        <p className="text-gray-500 mt-1">Управление и модерация заявок</p>
      </div>

      {/* Виджет статистики */}
      {stats && <LeadStatsWidget stats={stats} />}

      {/* Фильтры */}
      <LeadFilters
        currentSearch={params.search}
        currentStatus={params.status}
        currentResolution={params.resolution}
        currentDateFrom={params.dateFrom}
        currentDateTo={params.dateTo}
        currentSort={sort}
      />

      {/* Таблица заявок */}
      <LeadsTable leads={leads} pagination={pagination} />
    </div>
  );
}