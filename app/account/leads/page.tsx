"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LeadStatus } from "@prisma/client";
import {
  TAB_STATUS_MAP,
  TAB_LABELS,
  LEAD_STATUS_LABELS,
  LEAD_STATUS_COLORS,
} from "@/lib/lead-status-config";

interface Lead {
  id: string;
  client: {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    telegram: string | null;
    vk: string | null;
    complaintCount?: number;
  };
  message: string | null;
  status: LeadStatus;
  isSuspicious: boolean;
  suspiciousReason: string | null;
  createdAt: string;
  viewedAt: string | null;
  statusChangedAt: string | null;
}

interface LeadsResponse {
  success: boolean;
  leads?: Lead[];
  total?: number;
  page?: number;
  limit?: number;
  error?: string;
}

function getStatusColorClass(color: string): string {
  const colors: Record<string, string> = {
    green: "bg-green-100 text-green-800",
    blue: "bg-blue-100 text-blue-800",
    yellow: "bg-yellow-100 text-yellow-800",
    red: "bg-red-100 text-red-800",
    gray: "bg-gray-100 text-gray-800",
    purple: "bg-purple-100 text-purple-800",
  };
  return colors[color] || colors.gray;
}

export default function LeadsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>("new");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Получение списка заявок
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const statuses = TAB_STATUS_MAP[activeTab];
      const params = new URLSearchParams({
        statuses: statuses.join(","),
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`/api/leads?${params}`);
      const data: LeadsResponse = await response.json();

      if (data.success && data.leads) {
        setLeads(data.leads);
        setTotal(data.total || 0);
      } else {
        setError(data.error || "Ошибка при загрузке заявок");
      }
    } catch (err) {
      setError("Ошибка при загрузке заявок");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Обработка переключения вкладки
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
    router.push(`/account/leads?tab=${tab}`, { scroll: false });
  };

  // Обработка пагинации
  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page * limit < total) {
      setPage(page + 1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/30">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Заявки</h1>
          <p className="text-gray-600">Управляйте заявками от клиентов</p>
        </header>

        {/* Вкладки */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {Object.entries(TAB_LABELS).map(([tabKey, label]) => {
              const isActive = activeTab === tabKey;
              return (
                <button
                  key={tabKey}
                  onClick={() => handleTabChange(tabKey)}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                    ${
                      isActive
                        ? "border-[#5858E2] text-[#5858E2]"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }
                  `}
                >
                  {label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Контент */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <svg
              className="animate-spin h-8 w-8 text-[#5858E2]"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        ) : leads.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-500">
              {activeTab === "new"
                ? "Нет новых заявок"
                : activeTab === "accepted"
                ? "Нет принятых заявок"
                : "Нет заявок в архиве"}
            </p>
          </div>
        ) : (
          <>
            {/* Список заявок */}
            <div className="space-y-4">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  {/* Предупреждение о подозрительном клиенте */}
                  {lead.isSuspicious && (
                    <div className="mb-3 flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-yellow-800 text-sm">
                      <svg
                        className="h-5 w-5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <span>
                        На этого клиента жаловались {lead.client.complaintCount || 0} раз. Будьте осторожны
                      </span>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Заголовок */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">
                          {lead.client.name || "Аноним"}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColorClass(
                            LEAD_STATUS_COLORS[lead.status]
                          )}`}
                        >
                          {LEAD_STATUS_LABELS[lead.status]}
                        </span>
                      </div>

                      {/* Сообщение */}
                      {lead.message && (
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                          {lead.message.length > 70
                            ? `${lead.message.slice(0, 70)}...`
                            : lead.message}
                        </p>
                      )}

                      {/* Мета-информация */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          {new Date(lead.createdAt).toLocaleDateString("ru-RU", {
                            day: "numeric",
                            month: "long",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {lead.client.email && (
                          <span className="truncate">{lead.client.email}</span>
                        )}
                      </div>
                    </div>

                    {/* Кнопка */}
                    <a
                      href={`/account/leads/${lead.id}`}
                      className="flex-shrink-0 inline-flex items-center px-4 py-2 bg-[#5858E2] text-white text-sm font-medium rounded-lg hover:bg-[#4d4dd0] transition-colors"
                    >
                      Подробнее
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Пагинация */}
            {total > limit && (
              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={handlePrevPage}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Предыдущая
                </button>
                <span className="text-sm text-gray-600">
                  Страница {page} из {Math.ceil(total / limit)}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={page * limit >= total}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Следующая →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}