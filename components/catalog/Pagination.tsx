"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl?: string;
  preserveParams?: string[];
}

export function Pagination({ 
  currentPage, 
  totalPages, 
  baseUrl = "/catalog",
  preserveParams = [] 
}: PaginationProps) {
  const searchParams = useSearchParams();

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams();
    
    // Сохраняем указанные параметры
    preserveParams.forEach(param => {
      const value = searchParams?.get(param);
      if (value) {
        params.set(param, value);
      }
    });
    
    // Добавляем номер страницы
    if (page > 1) {
      params.set("page", page.toString());
    }
    
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  const buildPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5; // Максимум видимых номеров страниц
    
    if (totalPages <= maxVisible) {
      // Если страниц мало, показываем все
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Всегда показываем первую страницу
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push("...");
      }
      
      // Показываем страницы вокруг текущей
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push("...");
      }
      
      // Всегда показываем последнюю страницу
      pages.push(totalPages);
    }
    
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-center gap-1 mt-6" aria-label="Пагинация">
      {/* Кнопка "Назад" - показываем только если не первая страница */}
      {currentPage > 1 && (
        <Link
          href={buildPageUrl(currentPage - 1)}
          className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
      )}

      {/* Номера страниц */}
      <div className="flex items-center gap-1">
        {buildPageNumbers().map((page, index) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="flex items-center justify-center w-10 h-10 text-gray-500"
              >
                ...
              </span>
            );
          }

          const pageNum = page as number;
          const isActive = pageNum === currentPage;

          return (
            <Link
              key={pageNum}
              href={buildPageUrl(pageNum)}
              className={`flex items-center justify-center w-10 h-10 rounded-lg border text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#5858E2] border-[#5858E2] text-white"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {pageNum}
            </Link>
          );
        })}
      </div>

      {/* Кнопка "Вперёд" - показываем только если не последняя страница */}
      {currentPage < totalPages && (
        <Link
          href={buildPageUrl(currentPage + 1)}
          className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </Link>
      )}
    </nav>
  );
}