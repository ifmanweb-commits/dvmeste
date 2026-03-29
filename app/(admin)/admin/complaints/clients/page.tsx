import Link from "next/link";
import { getComplaintsAgainstClients } from "@/lib/actions/admin-complaints";
import { ComplaintsTable } from "../components/ComplaintsTable";
import { ComplaintsSearch } from "../components/ComplaintsSearch";

type SearchParams = {
  page?: string;
  search?: string;
  psychologist?: string;
  client?: string;
};

export default async function ComplaintsClientsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const page = params.page ? parseInt(params.page) : 1;
  const search = params.search || "";
  const psychologist = params.psychologist || "";
  const client = params.client || "";

  // Определяем, является ли поиск email или ID
  const isEmail = (val: string) => val.includes("@");
  const isId = (val: string) => /^[a-zA-Z0-9]+$/.test(val);

  // Если это email или имя - используем search, если ID - используем psychologistId/clientId
  const result = await getComplaintsAgainstClients({
    page,
    limit: 50,
    search: search || (psychologist && !isId(psychologist) ? psychologist : "") || (client && !isId(client) ? client : ""),
    psychologistId: (psychologist && isId(psychologist)) ? psychologist : undefined,
    clientId: (client && isId(client)) ? client : undefined,
  });

  if (!result.success) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {result.error || "Ошибка при загрузке жалоб"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Жалобы</h1>
        <div className="text-sm text-gray-500">
          Всего: {result.data!.pagination.total}
        </div>
      </div>

      {/* Вкладки */}
      <div className="flex gap-2 border-b border-gray-200">
        <Link
          href="/admin/complaints/clients"
          className="px-4 py-2 text-sm font-medium text-[#5858E2] border-b-2 border-[#5858E2] hover:text-[#4a4ac7]"
        >
          На клиентов
        </Link>
        <Link
          href="/admin/complaints/psychologists"
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
        >
          На психологов
        </Link>
      </div>

      {/* Поиск */}
      <ComplaintsSearch type="client" />

      {/* Таблица */}
      <ComplaintsTable
        complaints={result.data!.complaints}
        currentPage={result.data!.pagination.currentPage}
        totalPages={result.data!.pagination.totalPages}
        type="client"
      />
    </div>
  );
}
