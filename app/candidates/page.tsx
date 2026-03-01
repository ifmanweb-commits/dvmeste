import { prisma } from "@/lib/prisma";
import Link from "next/link";

const ITEMS_PER_PAGE = 20;

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // Получаем кандидатов со статусом CANDIDATE
  const [candidates, totalCount] = await Promise.all([
    prisma.psychologist.findMany({
      where: {
        status: "CANDIDATE",
      },
      select: {
        id: true,
        fullName: true,
        price: true,
        contactInfo: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: offset,
      take: ITEMS_PER_PAGE,
    }),
    prisma.psychologist.count({
      where: {
        status: "CANDIDATE",
      },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Hero секция */}
      <section className="bg-white border-b border-neutral-200">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-4">
            Кандидаты в каталог
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl">
            Психологи, которые не проходили экзаменацию по нашим строгим правилам. У них не подтвержден даже первый уровень квалификации.
          </p>
        </div>
      </section>

      {/* Основной контент */}
      <section className="container mx-auto px-4 py-8">
        {candidates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Сейчас нет кандидатов</p>
          </div>
        ) : (
          <>
            {/* Таблица */}
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-neutral-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Имя
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Цена
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Контакты
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {candidates.map((candidate) => (
                    <tr 
                      key={candidate.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        
                          {candidate.fullName}
                        
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {candidate.price > 0 ? `${candidate.price} ₽` : "—"}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {candidate.contactInfo || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Пагинация */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <Link
                    key={pageNum}
                    href={`/candidates?page=${pageNum}`}
                    className={`
                      px-4 py-2 rounded-lg border transition-colors
                      ${currentPage === pageNum 
                        ? "bg-[#5858E2] text-white border-[#5858E2]" 
                        : "bg-white text-gray-600 border-neutral-200 hover:border-[#5858E2] hover:text-[#5858E2]"
                      }
                    `}
                  >
                    {pageNum}
                  </Link>
                ))}
              </div>
            )}

            {/* Информация о количестве */}
            <p className="text-center text-sm text-gray-500 mt-4">
              Показано {offset + 1}–{Math.min(offset + ITEMS_PER_PAGE, totalCount)} из {totalCount} кандидатов
            </p>
          </>
        )}
      </section>
    </div>
  );
}