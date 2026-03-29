import Link from "next/link";
import { getPsychologistsWithComplaints } from "@/lib/actions/admin-complaints";
import { PsychologistsTable } from "./components/PsychologistsTable";
import { ComplaintsSearch } from "../components/ComplaintsSearch";

type SearchParams = {
  page?: string;
  search?: string;
};

export default async function ComplaintsPsychologistsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const page = params.page ? parseInt(params.page) : 1;
  const search = params.search || "";

  const result = await getPsychologistsWithComplaints({
    page,
    limit: 50,
    search,
  });

  if (!result.success) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {result.error || "Ошибка при загрузке психологов"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Жалобы на психологов</h1>
        <div className="text-sm text-gray-500">
          Всего: {result.data!.pagination.total}
        </div>
      </div>

      {/* Вкладки */}
      <div className="flex gap-2 border-b border-gray-200">
        <Link
          href="/admin/complaints/clients"
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
        >
          На клиентов
        </Link>
        <Link
          href="/admin/complaints/psychologists"
          className="px-4 py-2 text-sm font-medium text-[#5858E2] border-b-2 border-[#5858E2] hover:text-[#4a4ac7]"
        >
          На психологов
        </Link>
      </div>

      {/* Поиск */}
      <ComplaintsSearch type="psychologist" />

      {/* Таблица психологов */}
      <PsychologistsTable
        psychologists={result.data!.psychologists}
        currentPage={result.data!.pagination.currentPage}
        totalPages={result.data!.pagination.totalPages}
      />
    </div>
  );
}