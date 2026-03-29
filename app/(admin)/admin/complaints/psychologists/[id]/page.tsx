import Link from "next/link";
import { notFound } from "next/navigation";
import { getPsychologistComplaints, deleteComplaint, resolveComplaint } from "@/lib/actions/admin-complaints";
import { ComplaintsDetailTable } from "./components/ComplaintsDetailTable";

type SearchParams = {
  page?: string;
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
};

export default async function PsychologistComplaintsPage({
  params,
  searchParams,
}: PageProps) {
  const { id: psychologistId } = await params;
  const resolvedSearchParams = await searchParams;
  
  const page = resolvedSearchParams.page ? parseInt(resolvedSearchParams.page) : 1;

  const result = await getPsychologistComplaints(psychologistId, {
    page,
    limit: 50,
  });

  if (!result.success || !result.data?.psychologist) {
    notFound();
  }

  const { psychologist, complaints, stats, pagination } = result.data;

  return (
    <div className="space-y-6">
      {/* Заголовок и навигация */}
      <div className="flex justify-between items-center">
        <div>
          <Link
            href="/admin/complaints/psychologists"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Назад к списку
          </Link>
          <h1 className="text-2xl font-semibold mt-2">Жалобы на психолога</h1>
        </div>
      </div>

      {/* Информация о психологе */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Информация о психологе</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">ФИО</p>
            <p className="text-base font-medium">{psychologist.fullName || "Без имени"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="text-base">{psychologist.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">ID</p>
            <p className="text-base font-mono text-sm">{psychologist.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Слаг</p>
            <p className="text-base">{psychologist.slug || "—"}</p>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-700">Всего заявок</p>
            <p className="text-2xl font-bold text-green-900">{stats.leadsCount}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-red-700">Всего жалоб</p>
            <p className="text-2xl font-bold text-red-900">{stats.totalComplaints}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm text-yellow-700">Нерешённых жалоб</p>
            <p className="text-2xl font-bold text-yellow-900">{stats.unresolvedComplaints}</p>
          </div>
        </div>

        {/* Предупреждение о расхождении */}
        {stats.totalComplaints > 0 && stats.leadsCount > 0 && stats.totalComplaints > stats.leadsCount * 2 && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
            <p className="font-medium">Подозрительное расхождение</p>
            <p className="text-sm mt-1">
              У психолога {stats.leadsCount} заявок и {stats.totalComplaints} жалоб. 
              Большое количество жалоб при малом числе заявок может указывать на ложные обвинения.
            </p>
          </div>
        )}
      </div>

      {/* Таблица жалоб */}
      <ComplaintsDetailTable
        complaints={complaints}
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        psychologistId={psychologistId}
      />
    </div>
  );
}