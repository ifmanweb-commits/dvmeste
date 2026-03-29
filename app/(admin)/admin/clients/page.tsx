import Link from "next/link";
import { getClients } from "@/lib/actions/admin-clients";
import { ClientsTable } from "./components/ClientsTable";
import { ClientsFilters } from "./components/ClientsFilters";

type SearchParams = {
  page?: string;
  search?: string;
  complaintCountFrom?: string;
  isShadowBanned?: string;
  sortBy?: string;
  sortOrder?: string;
};

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const page = params.page ? parseInt(params.page) : 1;
  const search = params.search || "";
  const complaintCountFrom = params.complaintCountFrom
    ? parseInt(params.complaintCountFrom)
    : undefined;
  const isShadowBanned = params.isShadowBanned === "true" ? true : undefined;
  const sortBy = (params.sortBy as "createdAt" | "complaintCount") || "createdAt";
  const sortOrder = (params.sortOrder as "asc" | "desc") || "desc";

  const result = await getClients({
    page,
    limit: 50,
    search,
    complaintCountFrom,
    isShadowBanned,
    sortBy,
    sortOrder,
  });

  if (!result.success) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {result.error || "Ошибка при загрузке клиентов"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Клиенты</h1>
        <div className="text-sm text-gray-500">
          Всего: {result.data!.pagination.total}
        </div>
      </div>

      {/* Фильтры */}
      <ClientsFilters
        currentSearch={search}
        currentComplaintCountFrom={complaintCountFrom}
        currentIsShadowBanned={isShadowBanned}
        currentSortBy={sortBy}
        currentSortOrder={sortOrder}
      />

      {/* Таблица */}
      <ClientsTable
        clients={result.data!.clients}
        currentPage={result.data!.pagination.currentPage}
        totalPages={result.data!.pagination.totalPages}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />
    </div>
  );
}