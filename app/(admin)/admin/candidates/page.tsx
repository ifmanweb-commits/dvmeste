import Link from "next/link";
import { getCandidatesList } from "@/lib/actions/admin-candidates";
import { CandidatesTable } from "@/components/admin/CandidatesTable";
import { SearchForm } from "@/components/admin/SearchForm";

type SearchParams = {
  page?: string;
  search?: string;
};

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  
  // Преобразуем page в число, если есть, иначе 1
  const page = params.page ? parseInt(params.page) : 1;
  const search = params.search || "";

  const { items, total, pages, currentPage } = await getCandidatesList({
    page, // теперь page точно number
    limit: 40,
    search,
  });

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Непроверенные психологи</h1>
            <p className="text-gray-500 mt-1">Управление кандидатами на обучение</p>
          </div>
          <div className="text-sm text-gray-600 text-right">
            <div className="font-medium">Всего: {total}</div>
          </div>
        </div>

        {/* Вкладки */}
        <div className="flex gap-2 border-b border-gray-200 mt-4">
          <Link
            href="/admin/psychologists"
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
          >
            Проверенные
          </Link>
          <Link
            href="/admin/candidates"
            className="px-4 py-2 text-sm font-medium text-[#5858E2] border-b-2 border-[#5858E2] hover:text-[#4a4ac7]"
          >
            Непроверенные
          </Link>
        </div>
      </div>

      {/* Поиск */}
      <div className="mb-6">
        <SearchForm initialSearch={search}/>
      </div>

      {/* Таблица */}
      <CandidatesTable 
        candidates={items} 
        currentPage={currentPage}
        totalPages={pages}
        search={search}
      />
    </div>
  );
}