"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface Candidate {
  id: string;
  fullName: string;
  email: string;
  price: number;
  contactInfo: string | null;
  createdAt: Date;
}

interface CandidatesTableProps {
  candidates: Candidate[];
  currentPage: number;
  totalPages: number;
  search: string;
}

// Форматирование даты для России
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function CandidatesTable({ 
  candidates, 
  currentPage, 
  totalPages,
  search 
}: CandidatesTableProps) {
  const router = useRouter();

  const goToPage = (page: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", page.toString());
    router.push(`/admin/candidates?${params.toString()}`);
  };

  if (candidates.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
        <p className="text-gray-500">Кандидаты не найдены</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-neutral-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Имя
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Email
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Цена
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Контакты
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Дата регистрации
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
                  <Link 
                    href={`/admin/psychologists/${candidate.id}/edit`}
                    className="text-[#5858E2] hover:underline"
                  >
                    {candidate.fullName}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <a 
                    href={`mailto:${candidate.email}`}
                    className="text-[#5858E2] hover:underline"
                  >
                    {candidate.email}
                  </a>
                </td>
                <td className="px-6 py-4 font-medium">
                  {candidate.price > 0 ? `${candidate.price} ₽` : "—"}
                </td>
                <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                  {candidate.contactInfo || "—"}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {formatDate(candidate.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-neutral-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-100 transition-colors"
          >
            ←
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={`
                px-4 py-2 rounded-lg transition-colors
                ${currentPage === page 
                  ? "bg-[#5858E2] text-white" 
                  : "border border-neutral-200 hover:bg-neutral-100"
                }
              `}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-neutral-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-100 transition-colors"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}