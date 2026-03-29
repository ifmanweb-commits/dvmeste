"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { toggleClientShadowBan } from "@/lib/actions/admin-clients";

interface Client {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  complaintCount: number;
  isShadowBanned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ClientsTableProps {
  clients: Client[];
  currentPage: number;
  totalPages: number;
  sortBy: "createdAt" | "complaintCount";
  sortOrder: "asc" | "desc";
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export function ClientsTable({
  clients,
  currentPage,
  totalPages,
  sortBy,
  sortOrder,
}: ClientsTableProps) {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleToggleBan = (clientId: string) => {
    startTransition(async () => {
      await toggleClientShadowBan(clientId);
      // Перезагружаем страницу для обновления данных
      window.location.reload();
    });
  };

  const getSortLink = (field: "createdAt" | "complaintCount") => {
    const newOrder = sortBy === field && sortOrder === "desc" ? "asc" : "desc";
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", field);
    params.set("sortOrder", newOrder);
    return `/admin/clients?${params.toString()}`;
  };

  return (
    <div>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700">
                <Link
                  href={getSortLink("createdAt")}
                  className="hover:text-[#5858E2] flex items-center gap-1"
                >
                  Дата регистрации
                  {sortBy === "createdAt" && (
                    <span>{sortOrder === "desc" ? "↓" : "↑"}</span>
                  )}
                </Link>
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Имя</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Телефон</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">
                <Link
                  href={getSortLink("complaintCount")}
                  className="hover:text-[#5858E2] flex items-center gap-1"
                >
                  Жалобы
                  {sortBy === "complaintCount" && (
                    <span>{sortOrder === "desc" ? "↓" : "↑"}</span>
                  )}
                </Link>
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Бан</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Действия</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Клиентов не найдено
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr
                  key={client.id}
                  className={`border-t border-gray-100 hover:bg-gray-50 ${
                    client.isShadowBanned ? "bg-yellow-50" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(client.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="text-[#5858E2] hover:underline font-medium"
                    >
                      {client.email}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {client.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {client.phone || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {client.complaintCount > 0 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {client.complaintCount}
                      </span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {client.isShadowBanned ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Заблокирован
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleBan(client.id)}
                      disabled={isPending}
                      className={`text-xs px-3 py-1 rounded border transition-colors disabled:opacity-50 ${
                        client.isShadowBanned
                          ? "border-green-200 text-green-700 hover:bg-green-50"
                          : "border-red-200 text-red-700 hover:bg-red-50"
                      }`}
                    >
                      {client.isShadowBanned ? "Разблокировать" : "Заблокировать"}
                    </button>
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