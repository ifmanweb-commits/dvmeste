                                           
"use client";

import { useState, useEffect, useRef } from "react";
import { Filter, X } from "lucide-react";
import { CatalogSidebar } from "./CatalogSidebar";

type Props = {
  initialParams: Record<string, string | string[] | undefined>;
};

export function MobileFilters({ initialParams }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

                                                        
  useEffect(() => {
    const checkActiveFilters = () => {
      const params = [
        'priceMin', 'priceMax', 'city', 'gender', 'paradigms', 'levels', 
        'sortBy', 'sortOrder', 'ageMin', 'ageMax'
      ];
      
      const hasFilters = params.some(param => {
        const value = initialParams[param];
        if (Array.isArray(value)) {
          return value.length > 0 && value[0] !== "";
        }
        return value !== "" && value !== undefined && value !== null;
      });
      
      setHasActiveFilters(hasFilters);
    };

    checkActiveFilters();
  }, [initialParams]);

                              
  const handleFormSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
                                                  
    setTimeout(() => setIsOpen(false), 300);
  };

                               
  const handleResetFilters = () => {
                                                    
    const resetBtn = formRef.current?.querySelector('[type="reset"]');
    if (resetBtn instanceof HTMLButtonElement) {
      resetBtn.click();
    }
  };

  return (
    <>
      {                                          }
      <div className="sm:hidden mb-4">
        <button
          onClick={() => setIsOpen(true)}
          className="relative flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-[#5858E2] to-[#6B8E23] text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
        >
          <Filter className="w-5 h-5" />
          <span>Фильтры и сортировка</span>
          
          {                                 }
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              !
            </span>
          )}
        </button>
        
        {                                         }
        {hasActiveFilters && (
          <div className="mt-2 flex flex-wrap gap-1">
            {initialParams.priceMin && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                От {initialParams.priceMin}₽
              </span>
            )}
            {initialParams.priceMax && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                До {initialParams.priceMax}₽
              </span>
            )}
            {initialParams.city && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                {initialParams.city}
              </span>
            )}
            {initialParams.gender && (
              <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                {initialParams.gender === "М" ? "Муж" : "Жен"}
              </span>
            )}
            {initialParams.ageMin && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                От {initialParams.ageMin} лет
              </span>
            )}
            {initialParams.ageMax && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                До {initialParams.ageMax} лет
              </span>
            )}
          </div>
        )}
      </div>

      {                             }
      {isOpen && (
        <>
          {                                 }
          <div 
            className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
          />
          
          {                                 }
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white z-[60] flex flex-col shadow-2xl animate-slide-in-right">
            {                  }
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-[#5858E2] to-[#6B8E23] text-white">
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5" />
                <div>
                  <h2 className="text-lg font-bold">Фильтры</h2>
                  {hasActiveFilters && (
                    <p className="text-xs opacity-90">Активные фильтры применены</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {                                   }
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <CatalogSidebar 
                  initialParams={initialParams} 
                  onFormSubmit={handleFormSubmit}
                 
                />
              </div>
            </div>

            {                                 }
            <div className="border-t border-gray-200 p-4 space-y-3">
              {                                                       }
            
              
              {                     }
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-3 bg-gradient-to-r from-[#5858E2] to-[#6B8E23] text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                Закрыть фильтры
              </button>
            </div>
          </div>
        </>
      )}

      {                        }
      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </>
  );
}