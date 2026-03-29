"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LeadStatus, LeadResolution } from "@prisma/client";

interface LeadFiltersProps {
  currentSearch?: string;
  currentStatus?: LeadStatus;
  currentResolution?: string;
  currentDateFrom?: string;
  currentDateTo?: string;
  currentSort?: "asc" | "desc";
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

export function LeadFilters({
  currentSearch = "",
  currentStatus,
  currentResolution,
  currentDateFrom,
  currentDateTo,
  currentSort = "desc",
}: LeadFiltersProps) {
  const router = useRouter();
  const [search, setSearch] = useState(currentSearch);
  const [status, setStatus] = useState<LeadStatus | "">(currentStatus || "");
  const [resolution, setResolution] = useState<LeadResolution | "">(
    (currentResolution as LeadResolution) || ""
  );
  const [dateFrom, setDateFrom] = useState(currentDateFrom || "");
  const [dateTo, setDateTo] = useState(currentDateTo || "");
  const [sort, setSort] = useState<"asc" | "desc">(currentSort);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    params.set("page", "1"); // Сброс на первую страницу при фильтрации

    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (resolution) params.set("resolution", resolution);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (sort) params.set("sort", sort);

    router.push(`/admin/leads?${params.toString()}`);
  };

  const resetFilters = () => {
    router.push("/admin/leads");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-lg p-4 mb-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Поиск */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Поиск
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Email клиента или имя психолога"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5858E2] focus:border-transparent"
          />
        </div>

        {/* Статус */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Статус
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as LeadStatus | "")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5858E2] focus:border-transparent"
          >
            <option value="">Все</option>
            <option value="NEW">{getStatusText(LeadStatus.NEW)}</option>
            <option value="ACCEPTED">{getStatusText(LeadStatus.ACCEPTED)}</option>
            <option value="COMPLETED">{getStatusText(LeadStatus.COMPLETED)}</option>
          </select>
        </div>

        {/* Исход (resolution) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Исход
          </label>
          <select
            value={resolution}
            onChange={(e) =>
              setResolution(e.target.value as LeadResolution | "")
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5858E2] focus:border-transparent"
          >
            <option value="">Все</option>
            <option value="PSYCHOLOGIST_REJECTED">
              Психолог отказал
            </option>
            <option value="NO_CONTACT">Не удалось связаться</option>
            <option value="NO_AGREEMENT">Не договорились</option>
            <option value="CLIENT_DROPPED">Клиент пропал</option>
            <option value="FREE_ONLY">Только бесплатная</option>
            <option value="PAID_COMPLETED">Платная завершена</option>
          </select>
        </div>

        {/* Сортировка */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Сортировка
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "asc" | "desc")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5858E2] focus:border-transparent"
          >
            <option value="desc">Сначала новые</option>
            <option value="asc">Сначала старые</option>
          </select>
        </div>

        {/* Дата от */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Дата от
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5858E2] focus:border-transparent"
          />
        </div>

        {/* Дата до */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Дата до
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5858E2] focus:border-transparent"
          />
        </div>
      </div>

      {/* Кнопки */}
      <div className="flex gap-3 mt-4">
        <button
          type="submit"
          className="px-4 py-2 bg-[#5858E2] text-white rounded-lg text-sm font-medium hover:bg-[#4b4bcf] transition-colors"
        >
          Применить
        </button>
        <button
          type="button"
          onClick={resetFilters}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          Сбросить
        </button>
      </div>
    </form>
  );
}