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
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Кандидаты</h1>
          <p className="text-gray-500 mt-1">Управление кандидатами на обучение</p>
        </div>
        <div className="text-sm text-gray-500">
          Всего: {total}
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