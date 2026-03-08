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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Кандидаты</h1>
        <div className="text-sm text-gray-500">
          Всего: {total}
        </div>
      </div>

      {/* Поиск */}
      <SearchForm initialSearch={search} />

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