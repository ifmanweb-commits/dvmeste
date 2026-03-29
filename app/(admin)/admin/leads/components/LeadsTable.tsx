"use client";

import { useRouter } from "next/navigation";
import { LeadStatus, LeadResolution } from "@prisma/client";
import { markLeadAsSuspicious, shadowBanClient } from "@/lib/actions/leads";
interface Lead {
  id: string;
  clientId: string;
  psychologistId: string;
  message: string | null;
  status: LeadStatus;
  resolution: LeadResolution | null;
  isSuspicious: boolean;
  suspiciousReason: string | null;
  createdAt: Date;
  viewedAt: Date | null;
  statusChangedAt: Date | null;
  client: {
    id: string;
    email: string;
    name: string | null;
    isShadowBanned: boolean;
  };
  psychologist: {
    id: string;
    fullName: string | null;
    email: string;
    slug: string | null;
  };
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  total: number;
}

interface LeadsTableProps {
  leads: Lead[];
  pagination: Pagination;
}

// Перевод статусов
const getStatusText = (status: LeadStatus) => {
  const texts: Record<LeadStatus, string> = {
    NEW: "Новая",
    ACCEPTED: "Принята",
    COMPLETED: "Завершена",
  };
  return texts[status];
};

export function LeadsTable({ leads, pagination }: LeadsTableProps) {
  const router = useRouter();

  const handleLeadClick = (leadId: string) => {
    router.push(`/admin/leads/${leadId}`);
  };

  // Клик по клиенту — поиск по email
  const handleClientClick = (clientEmail: string, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/admin/leads?search=${encodeURIComponent(clientEmail)}`);
  };

  // Клик по психологу — поиск по email
  const handlePsychologistClick = (
    psychologistEmail: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    router.push(`/admin/leads?search=${encodeURIComponent(psychologistEmail)}`);
  };

  const getStatusBadgeClass = (status: LeadStatus) => {
    switch (status) {
      case LeadStatus.NEW:
        return "bg-green-100 text-green-800";
      case LeadStatus.ACCEPTED:
        return "bg-blue-100 text-blue-800";
      case LeadStatus.COMPLETED:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getResolutionText = (resolution: LeadResolution | null) => {
    if (!resolution) return null;
    const texts: Record<LeadResolution, string> = {
      PSYCHOLOGIST_REJECTED: "Психолог отказал",
      NO_CONTACT: "Не удалось связаться",
      NO_AGREEMENT: "Не договорились",
      CLIENT_DROPPED: "Клиент пропал",
      FREE_ONLY: "Только бесплатная",
      PAID_COMPLETED: "Платная завершена",
    };
    return texts[resolution];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", page.toString());
    router.push(`/admin/leads?${params.toString()}`);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Дата и время
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Психолог
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Клиент
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Сообщение
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Статус
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Исход
              </th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Заявок не найдено
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => handleLeadClick(lead.id)}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                    {formatDate(lead.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <button
                        onClick={(e) =>
                          handlePsychologistClick(lead.psychologist.email, e)
                        }
                        className="text-[#5858E2] hover:underline text-left font-medium"
                      >
                        {lead.psychologist.fullName || "Без имени"}
                      </button>
                      <span className="text-xs text-gray-500">
                        {lead.psychologist.email}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <button
                        onClick={(e) => handleClientClick(lead.client.email, e)}
                        className="text-[#5858E2] hover:underline text-left"
                      >
                        {lead.client.name || lead.client.email}
                      </button>
                      <span className="text-xs text-gray-500">
                        {lead.client.email}
                      </span>
                      {lead.client.isShadowBanned && (
                        <span className="text-xs text-red-600 font-medium mt-1">
                          ⚠️ Теневой бан
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                    {lead.message || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
                        lead.status
                      )}`}
                    >
                      {getStatusText(lead.status)}
                    </span>
                    {lead.isSuspicious && (
                      <span className="block text-xs text-red-600 mt-1">
                        ⚠️ Подозрительная
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-sm">
                    {getResolutionText(lead.resolution) || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Пагинация */}
      {pagination.totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Страница {pagination.currentPage} из {pagination.totalPages} (всего:{" "}
            {pagination.total})
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Назад
            </button>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasMore}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Вперед
            </button>
          </div>
        </div>
      )}
    </div>
  );
}