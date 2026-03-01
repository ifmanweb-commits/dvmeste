'use client';

import Link from "next/link";
import { useState, useMemo } from "react";
import { DB_SYNC_MESSAGE } from "@/lib/db-error";
import AuthGuard from "@/components/AuthGuard";

interface PsychologistItem {
  id: string;
  slug: string;
  fullName: string;
  city: string | null;
  isPublished: boolean;
  price: number | null;
  certificationLevel?: string | null;                                    
}

interface Props {
  initialList: PsychologistItem[];
  searchParams: Record<string, string | string[] | undefined>;
}

   
                                                             
   
export default function PsychologistsListPage({ initialList, searchParams }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyPublished, setShowOnlyPublished] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedCertification, setSelectedCertification] = useState<string>("all");
  
  const showDbSyncBanner = searchParams.error === "db_sync";

                                                                  
  const availableCities = useMemo(() => {
    const cities = initialList
      .map(p => p.city)
      .filter((city): city is string => city != null && city.trim() !== "")
      .sort((a, b) => a.localeCompare(b));
    
    return Array.from(new Set(cities));
  }, [initialList]);

  const availableCertifications = useMemo(() => {
    const certifications = initialList
      .map(p => p.certificationLevel)
      .filter((level): level is string => 
        level != null && typeof level === 'string' && level.trim() !== ""
      )
      .map(level => level.trim())
      .sort((a, b) => a.localeCompare(b));
    
    return Array.from(new Set(certifications));
  }, [initialList]);

                                      
  const filteredPsychologists = useMemo(() => {
    return initialList.filter((psychologist) => {
                             
      if (showOnlyPublished && !psychologist.isPublished) {
        return false;
      }

                         
      if (selectedCity !== "all") {
        if (!psychologist.city || psychologist.city !== selectedCity) {
          return false;
        }
      }

                                      
      if (selectedCertification !== "all") {
        const level = psychologist.certificationLevel;
        if (!level || level.toString().trim() !== selectedCertification) {
          return false;
        }
      }

                                        
      if (searchQuery.trim()) {
        const searchLower = searchQuery.toLowerCase().trim();
        const fullNameLower = psychologist.fullName.toLowerCase();
        
        if (fullNameLower.includes(searchLower)) {
          return true;
        }
        
        const nameParts = psychologist.fullName.split(' ');
        const hasMatchInParts = nameParts.some(part => 
          part.toLowerCase().includes(searchLower)
        );
        
        if (hasMatchInParts) {
          return true;
        }
        
        const initials = nameParts.map(part => part.charAt(0).toLowerCase()).join('');
        if (initials.includes(searchLower)) {
          return true;
        }
        
        return false;
      }

      return true;
    });
  }, [initialList, searchQuery, showOnlyPublished, selectedCity, selectedCertification]);

                                            
  const HighlightText = ({ text, highlight }: { text: string; highlight: string }) => {
    if (!highlight.trim()) return <>{text}</>;

    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-yellow-200 font-semibold px-0.5">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

                                                         
  const getSafeCertificationLevel = (level: string | null | undefined): string | null => {
    if (level == null) return null;
    if (typeof level !== 'string') {
      try {
        const stringValue = String(level);
        return stringValue.trim() || null;
      } catch {
        return null;
      }
    }
    const trimmed = level.trim();
    return trimmed || null;
  };

               
  const totalCount = initialList.length;
  const filteredCount = filteredPsychologists.length;
  const unpublishedCount = initialList.filter(p => !p.isPublished).length;
  const psychologistsWithCertification = initialList.filter(p => 
    getSafeCertificationLevel(p.certificationLevel) !== null
  ).length;

                                     
  const resetFilters = () => {
    setSearchQuery("");
    setShowOnlyPublished(false);
    setSelectedCity("all");
    setSelectedCertification("all");
  };

                                        
  const hasActiveFilters = 
    searchQuery.trim() !== "" || 
    showOnlyPublished || 
    selectedCity !== "all" || 
    selectedCertification !== "all";

  return (
    <AuthGuard requiredPermission="psychologists.view">
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="mx-auto max-w-7xl">
          {showDbSyncBanner && (
            <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-amber-800 sm:mb-6 sm:rounded-xl sm:p-4">
              <p className="font-medium text-sm sm:text-base">Ошибка базы данных</p>
              <p className="mt-1 text-xs sm:text-sm">{DB_SYNC_MESSAGE}</p>
            </div>
          )}
          
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h1 className="font-display text-xl font-bold text-gray-900 sm:text-2xl">
                  Психологи
                </h1>
                <div className="mt-1 text-sm text-gray-600">
                  Всего: {totalCount} {unpublishedCount > 0 && `(${unpublishedCount} неопубликованных)`}
                  {psychologistsWithCertification > 0 && (
                    <span className="ml-2 text-green-600">
                      ({psychologistsWithCertification} с указанным уровнем)
                    </span>
                  )}
                </div>
              </div>
              <Link
                href="/managers/psychologists/new"
                className="rounded-lg bg-[#4CAF50] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#43A047] text-center sm:rounded-xl sm:px-4 sm:py-2 sm:text-base whitespace-nowrap"
              >
                Добавить психолога
              </Link>
            </div>

            {                     }
            <div className="mb-6 space-y-4">
              {                   }
              <div className="relative">
                <input
                  type="text"
                  placeholder="Поиск по ФИО (Иванов, Иван, Ива)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4CAF50]/20 focus:border-[#4CAF50] outline-none"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {                     }
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-4">
                  {                          }
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="publishedOnly"
                      checked={showOnlyPublished}
                      onChange={(e) => setShowOnlyPublished(e.target.checked)}
                      className="h-4 w-4 text-[#4CAF50] border-gray-300 rounded focus:ring-[#4CAF50]"
                    />
                    <label htmlFor="publishedOnly" className="text-sm text-gray-700 whitespace-nowrap">
                      Только опубликованные
                    </label>
                  </div>

                  {                      }
                  <div className="flex items-center gap-2">
                    <label htmlFor="cityFilter" className="text-sm text-gray-700 whitespace-nowrap">
                      Город:
                    </label>
                    <select
                      id="cityFilter"
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-[#4CAF50]/20 focus:border-[#4CAF50] outline-none"
                    >
                      <option value="all">Все города</option>
                      {availableCities.map((city) => (
                        <option key={city} value={city}>
                          {city} ({initialList.filter(p => p.city === city).length})
                        </option>
                      ))}
                    </select>
                  </div>

                  {                                                                          }
                  {availableCertifications.length > 0 && (
                    <div className="flex items-center gap-2">
                      <label htmlFor="certificationFilter" className="text-sm text-gray-700 whitespace-nowrap">
                        Уровень:
                      </label>
                      <select
                        id="certificationFilter"
                        value={selectedCertification}
                        onChange={(e) => setSelectedCertification(e.target.value)}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-[#4CAF50]/20 focus:border-[#4CAF50] outline-none"
                      >
                        <option value="all">Все уровни</option>
                        {availableCertifications.map((level) => {
                          const count = initialList.filter(p => {
                            const pLevel = getSafeCertificationLevel(p.certificationLevel);
                            return pLevel === level;
                          }).length;
                          return (
                            <option key={level} value={level}>
                              {level} ({count})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}
                </div>

                {                    }
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="text-sm text-[#4CAF50] hover:text-[#43A047] font-medium whitespace-nowrap flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Сбросить фильтры
                  </button>
                )}
              </div>

              {                             }
              {(searchQuery || selectedCity !== "all" || selectedCertification !== "all") && (
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">Фильтры:</span>
                  
                  {searchQuery && (
                    <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                      Поиск: "{searchQuery}"
                      <button
                        onClick={() => setSearchQuery("")}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}
                  
                  {selectedCity !== "all" && (
                    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded">
                      Город: {selectedCity}
                      <button
                        onClick={() => setSelectedCity("all")}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}
                  
                  {selectedCertification !== "all" && (
                    <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded">
                      Уровень: {selectedCertification}
                      <button
                        onClick={() => setSelectedCertification("all")}
                        className="text-green-500 hover:text-green-700"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}
                  
                  {showOnlyPublished && (
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded">
                      Только опубликованные
                      <button
                        onClick={() => setShowOnlyPublished(false)}
                        className="text-amber-500 hover:text-amber-700"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}
                  
                  <span className="ml-2">
                    Найдено: {filteredCount} из {totalCount}
                  </span>
                </div>
              )}
            </div>

            {filteredPsychologists.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-600 mb-2">
                  {hasActiveFilters 
                    ? 'Психологи по указанным фильтрам не найдены'
                    : 'Пока нет ни одной анкеты. Создайте первую!'
                  }
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="mt-4 text-[#4CAF50] hover:text-[#43A047] font-medium"
                  >
                    Показать всех психологов
                  </button>
                )}
              </div>
            ) : (
              <ul className="space-y-3 sm:space-y-4">
                {filteredPsychologists.map((p) => {
                  const certificationLevel = getSafeCertificationLevel(p.certificationLevel);
                  
                  return (
                    <li
                      key={p.id}
                      className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-[#F5F5F7] p-4 hover:bg-gray-50 transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:rounded-xl"
                    >
                      <div className="space-y-1 sm:space-y-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                          <span className="font-medium text-gray-900 text-sm sm:text-base">
                            <HighlightText text={p.fullName} highlight={searchQuery} />
                          </span>
                          {!p.isPublished && (
                            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 whitespace-nowrap">
                              Черновик
                            </span>
                          )}
                          {p.city && (
                            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700 whitespace-nowrap">
                              {p.city}
                            </span>
                          )}
                          {                               }
                          {certificationLevel && (
                            <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800 whitespace-nowrap">
                              {certificationLevel}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-600 sm:text-sm">
                          {p.price && (
                            <span className="font-medium text-[#4CAF50]">
                              {p.price} ₽
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/managers/psychologists/${p.id}/edit`}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-900 hover:bg-white hover:border-[#4CAF50] hover:text-[#4CAF50] transition-colors text-center sm:flex-none sm:px-3 sm:py-1.5 sm:text-sm whitespace-nowrap"
                        >
                          Редактировать
                        </Link>
                        <Link
                          href={`/psy-list/${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-900 hover:bg-white hover:border-[#4CAF50] hover:text-[#4CAF50] transition-colors text-center sm:flex-none sm:px-3 sm:py-1.5 sm:text-sm whitespace-nowrap"
                        >
                          Открыть
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}