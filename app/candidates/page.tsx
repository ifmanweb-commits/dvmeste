import { prisma } from "@/lib/prisma";
import Link from "next/link";

const ITEMS_PER_PAGE = 20;

function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatWorkFormat(workFormat: string | null): string {
  if (!workFormat) return "—";
  switch (workFormat) {
    case "ONLINE":
      return "Онлайн";
    case "OFFLINE":
      return "Оффлайн";
    case "BOTH":
      return "Онлайн и оффлайн";
    default:
      return escapeHtml(workFormat);
  }
}

function getGenderDisplay(gender: string | null): string {
  if (!gender) return "—";
  switch (gender) {
    case "MALE":
      return "М";
    case "FEMALE":
      return "Ж";
    default:
      return "—";
  }
}

function calculateAge(birthDate: Date | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // Получаем непроверенных психологов со статусом CANDIDATE
  const [candidates, totalCount] = await Promise.all([
    prisma.user.findMany({
      where: {
        status: "CANDIDATE",
      },
      select: {
        id: true,
        fullName: true,
        city: true,
        gender: true,
        birthDate: true,
        workFormat: true,
        contactInfo: true,
        price: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: offset,
      take: ITEMS_PER_PAGE,
    }),
    prisma.user.count({
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
            Непроверенные психологи
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl">
            Психологи, которые ещё не прошли модерацию и не подтвердили свою квалификацию.
          </p>
        </div>
      </section>

      {/* Основной контент */}
      <section className="container mx-auto px-4 py-8">
        {candidates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Сейчас нет непроверенных психологов</p>
          </div>
        ) : (
          <>
            {/* Десктопная версия - таблица */}
            <div className="hidden md:block bg-white rounded-xl border border-neutral-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-neutral-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Имя
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Пол
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Возраст
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Город
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Формат работы
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Контакты
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Цена
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {candidates.map((candidate) => {
                    const age = calculateAge(candidate.birthDate);
                    return (
                      <tr
                        key={candidate.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="text-gray-900">
                            {escapeHtml(candidate.fullName)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {getGenderDisplay(candidate.gender)}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {age ? `${age} лет` : "—"}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {escapeHtml(candidate.city) || "—"}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {formatWorkFormat(candidate.workFormat)}
                        </td>
                        <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                          {escapeHtml(candidate.contactInfo) || "—"}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {candidate.price ? `${candidate.price} ₽` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Мобильная версия - карточки */}
            <div className="md:hidden space-y-4">
              {candidates.map((candidate) => {
                const age = calculateAge(candidate.birthDate);
                return (
                  <div key={candidate.id} className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {escapeHtml(candidate.fullName)}
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Пол:</span>
                        <span className="ml-2 font-medium text-gray-900">{getGenderDisplay(candidate.gender)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Возраст:</span>
                        <span className="ml-2 font-medium text-gray-900">{age ? `${age} лет` : "—"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Город:</span>
                        <span className="ml-2 font-medium text-gray-900">{escapeHtml(candidate.city) || "—"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Цена:</span>
                        <span className="ml-2 font-medium text-gray-900">{candidate.price ? `${candidate.price} ₽` : "—"}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-neutral-100">
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Формат:</span> {formatWorkFormat(candidate.workFormat)}
                      </p>
                      {candidate.contactInfo && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          <span className="font-medium">Контакты:</span> {escapeHtml(candidate.contactInfo)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
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
              Показано {offset + 1}–{Math.min(offset + ITEMS_PER_PAGE, totalCount)} из {totalCount} непроверенных психологов
            </p>
          </>
        )}
      </section>
    </div>
  );
}