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
import { LeadCard } from "@/components/account/leads/LeadCard";
import { AlertTriangle } from "lucide-react";

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
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Заявки</h1>
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
            {/* Список заявок - сетка карточек для новых и принятых, таблица для архива */}
            {activeTab === "archived" ? (
              /* Компактная таблица для архива */
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Клиент</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Действие</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <a href={`/account/leads/${lead.id}`} className="font-medium text-gray-900 hover:text-[#5858E2]">
                            {lead.client.name || "Аноним"}
                          </a>
                          {lead.isSuspicious && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Жалоб: {lead.client.complaintCount || 0}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColorClass(LEAD_STATUS_COLORS[lead.status])}`}>
                            {LEAD_STATUS_LABELS[lead.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(lead.createdAt).toLocaleDateString("ru-RU", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <a
                            href={`/account/leads/${lead.id}`}
                            className="text-[#5858E2] hover:text-[#4a4ac9] text-sm font-medium"
                          >
                            Подробнее →
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Сетка карточек для новых и принятых */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {leads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    id={lead.id}
                    client={lead.client}
                    message={lead.message}
                    status={lead.status}
                    isSuspicious={lead.isSuspicious}
                    createdAt={lead.createdAt}
                    statusChangedAt={lead.statusChangedAt}
                  />
                ))}
              </div>
            )}

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