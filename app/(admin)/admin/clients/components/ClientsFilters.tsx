"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

interface ClientsFiltersProps {
  currentSearch?: string;
  currentComplaintCountFrom?: number;
  currentIsShadowBanned?: boolean;
  currentSortBy?: "createdAt" | "complaintCount";
  currentSortOrder?: "asc" | "desc";
}

export function ClientsFilters({
  currentSearch = "",
  currentComplaintCountFrom,
  currentIsShadowBanned,
  currentSortBy = "createdAt",
  currentSortOrder = "desc",
}: ClientsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(currentSearch);
  const [complaintCountFrom, setComplaintCountFrom] = useState(
    currentComplaintCountFrom?.toString() || ""
  );
  const [isShadowBanned, setIsShadowBanned] = useState(
    currentIsShadowBanned?.toString() || ""
  );
  const [sortBy, setSortBy] = useState(currentSortBy);
  const [sortOrder, setSortOrder] = useState(currentSortOrder);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(() => {
      const params = new URLSearchParams();

      if (searchValue.trim()) {
        params.set("search", searchValue.trim());
      }

      if (complaintCountFrom.trim()) {
        const count = parseInt(complaintCountFrom);
        if (!isNaN(count) && count > 0) {
          params.set("complaintCountFrom", count.toString());
        }
      }

      if (isShadowBanned === "true") {
        params.set("isShadowBanned", "true");
      }

      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      router.push(`/admin/clients?${params.toString()}`);
    });
  };

  const handleClear = () => {
    setSearchValue("");
    setComplaintCountFrom("");
    setIsShadowBanned("");
    setSortBy("createdAt");
    setSortOrder("desc");
    startTransition(() => {
      router.push("/admin/clients");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end">
        {/* Поиск по email */}
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Поиск по email
          </label>
          <input
            type="email"
            id="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="example@mail.ru"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5858E2]"
          />
        </div>

        {/* Фильтр по жалобам */}
        <div className="w-[180px]">
          <label htmlFor="complaintCountFrom" className="block text-sm font-medium text-gray-700 mb-1">
            Жалоб от
          </label>
          <input
            type="number"
            id="complaintCountFrom"
            value={complaintCountFrom}
            onChange={(e) => setComplaintCountFrom(e.target.value)}
            placeholder="0"
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5858E2]"
          />
        </div>

        {/* Фильтр по бану */}
        <div className="w-[180px]">
          <label htmlFor="isShadowBanned" className="block text-sm font-medium text-gray-700 mb-1">
            Теневой бан
          </label>
          <select
            id="isShadowBanned"
            value={isShadowBanned}
            onChange={(e) => setIsShadowBanned(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5858E2]"
          >
            <option value="">Все</option>
            <option value="true">Заблокированные</option>
            <option value="false">Не заблокированные</option>
          </select>
        </div>

        {/* Сортировка */}
        <div className="w-[150px]">
          <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
            Сортировка
          </label>
          <select
            id="sortBy"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "createdAt" | "complaintCount")}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5858E2]"
          >
            <option value="createdAt">По дате</option>
            <option value="complaintCount">По жалобам</option>
          </select>
        </div>

        {/* Порядок сортировки */}
        <div className="w-[120px]">
          <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-1">
            Порядок
          </label>
          <select
            id="sortOrder"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5858E2]"
          >
            <option value="desc">По убыв.</option>
            <option value="asc">По возр.</option>
          </select>
        </div>

        {/* Кнопки */}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 bg-[#5858E2] text-white rounded-lg hover:bg-[#4a4ac7] disabled:opacity-50"
          >
            {isPending ? "..." : "Применить"}
          </button>
          {(searchValue || complaintCountFrom || isShadowBanned) && (
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Сбросить
            </button>
          )}
        </div>
      </div>
    </form>
  );
}