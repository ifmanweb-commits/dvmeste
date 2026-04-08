import Link from "next/link";
import { getUserAccesses, getSecretPages } from "./actions";
import AccessTable from "./components/AccessTable";
import AccessFilters from "./components/AccessFilters";
import GrantAccessModal from "./components/GrantAccessModal";
import { getCurrentUser } from "@/lib/auth/session";

type SearchParams = {
  page?: string;
  search?: string;
  resourceType?: string;
  resourceId?: string;
  source?: string;
};

export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const page = params.page ? parseInt(params.page) : 1;
  const search = params.search || "";
  const resourceType = params.resourceType || "";
  const resourceId = params.resourceId || "";
  const source = (params.source as 'admin' | 'key') || undefined;

  const [currentUser, accessResult, pagesResult] = await Promise.all([
    getCurrentUser(),
    getUserAccesses({
      page,
      limit: 50,
      search: search || undefined,
      resourceType: resourceType || undefined,
      resourceId: resourceId || undefined,
      source
    }),
    getSecretPages()
  ]);

  if (!accessResult.success) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {accessResult.error || "Ошибка при загрузке доступов"}
        </div>
      </div>
    );
  }

  const secretPages: { id: string; title: string; slug: string }[] = pagesResult.success && pagesResult.data ? pagesResult.data : [];

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Доступы</h1>
          <p className="text-gray-500 mt-1">Управление доступами к секретным страницам</p>
        </div>
        <div className="flex gap-3">
          <div className="text-sm text-gray-500 self-center">
            Всего: {accessResult.data!.pagination.total}
          </div>
          <GrantAccessModal secretPages={secretPages} adminId={currentUser?.id || ''} />
        </div>
      </div>

      {/* Фильтры */}
      <div className="mb-6">
        <AccessFilters
          currentSearch={search}
          currentResourceType={resourceType}
          currentResourceId={resourceId}
          currentSource={source}
          secretPages={secretPages}
        />
      </div>

      {/* Таблица */}
      <AccessTable
        accesses={accessResult.data!.accesses}
        currentPage={accessResult.data!.pagination.currentPage}
        totalPages={accessResult.data!.pagination.totalPages}
      />
    </div>
  );
}