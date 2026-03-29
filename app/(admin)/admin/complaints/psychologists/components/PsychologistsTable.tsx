"use client";

import Link from "next/link";

interface PsychologistWithComplaints {
  id: string;
  fullName: string | null;
  email: string;
  slug: string | null;
  unresolvedComplaints: number;
  totalComplaints: number;
  leadsCount: number;
}

interface PsychologistsTableProps {
  psychologists: PsychologistWithComplaints[];
  currentPage: number;
  totalPages: number;
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

export function PsychologistsTable({
  psychologists,
  currentPage,
  totalPages,
}: PsychologistsTableProps) {
  return (
    <div>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Психолог</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Жалобы (нереш.)</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Жалобы (всего)</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Заявки</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Действия</th>
            </tr>
          </thead>
          <tbody>
            {psychologists.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Психологов с жалобами не найдено
                </td>
              </tr>
            ) : (
              psychologists.map((psy) => (
                <tr
                  key={psy.id}
                  className="border-t border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/psychologists/${psy.id}/edit`}
                      className="text-[#5858E2] hover:underline font-medium"
                    >
                      {psy.fullName || "Без имени"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {psy.email}
                  </td>
                  <td className="px-4 py-3">
                    {psy.unresolvedComplaints > 0 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {psy.unresolvedComplaints}
                      </span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {psy.totalComplaints}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {psy.leadsCount}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/complaints/psychologists/${psy.id}`}
                      className="text-[#5858E2] hover:underline text-sm font-medium"
                    >
                      Все жалобы →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          {currentPage > 1 && (
            <Link
              href={`?page=${currentPage - 1}`}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              ← Назад
            </Link>
          )}
          <span className="text-gray-600">
            Страница {currentPage} из {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link
              href={`?page=${currentPage + 1}`}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Вперёд →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}