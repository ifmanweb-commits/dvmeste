"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface SearchFormProps {
  initialSearch?: string;
}

export function SearchForm({ initialSearch = "" }: SearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams(searchParams);
    if (search) {
      params.set("search", search);
      params.set("page", "1"); // Сбрасываем на первую страницу
    } else {
      params.delete("search");
    }
    
    router.push(`/admin/candidates?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-md">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Поиск по имени, email или контактам..."
        className="flex-1 p-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#5858E2]/20 focus:border-[#5858E2] outline-none"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-[#5858E2] text-white rounded-lg hover:bg-[#4747b5] transition-colors"
      >
        Найти
      </button>
      {search && (
        <button
          type="button"
          onClick={() => {
            setSearch("");
            router.push("/admin/candidates");
          }}
          className="px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          Сбросить
        </button>
      )}
    </form>
  );
}