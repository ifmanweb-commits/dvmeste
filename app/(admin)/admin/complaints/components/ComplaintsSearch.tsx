"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

interface ComplaintsSearchProps {
  type: "client" | "psychologist";
}

export function ComplaintsSearch({ type }: ComplaintsSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      
      if (searchValue.trim()) {
        // Определяем тип поиска по формату
        if (searchValue.includes("@")) {
          // Email
          if (type === "client") {
            params.set("psychologist", searchValue.trim());
            params.delete("client");
          } else {
            params.set("client", searchValue.trim());
            params.delete("psychologist");
          }
          params.delete("search");
        } else if (/^[a-zA-Z0-9]+$/.test(searchValue.trim())) {
          // ID (простая эвристика)
          if (type === "client") {
            params.set("psychologist", searchValue.trim());
            params.delete("client");
          } else {
            params.set("client", searchValue.trim());
            params.delete("psychologist");
          }
          params.delete("search");
        } else {
          // Имя (contains)
          params.set("search", searchValue.trim());
          params.delete("psychologist");
          params.delete("client");
        }
      } else {
        params.delete("search");
        params.delete("psychologist");
        params.delete("client");
      }
      
      params.delete("page"); // Сброс пагинации
      router.push(`?${params.toString()}`);
    });
  };

  const handleClear = () => {
    setSearchValue("");
    startTransition(() => {
      router.push("/admin/complaints/" + (type === "client" ? "clients" : "psychologists"));
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center">
      <div className="flex-1 flex gap-2">
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder={
            type === "client"
              ? "Поиск по психологу (email, ID, имя)"
              : "Поиск по клиенту (email, ID)"
          }
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5858E2]"
        />
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-[#5858E2] text-white rounded-lg hover:bg-[#4a4ac7] disabled:opacity-50"
        >
          {isPending ? "..." : "Найти"}
        </button>
        {(searchValue || searchParams.get("psychologist") || searchParams.get("client")) && (
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Сбросить
          </button>
        )}
      </div>
    </form>
  );
}