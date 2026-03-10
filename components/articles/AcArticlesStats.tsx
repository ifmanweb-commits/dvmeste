// components/articles/ArticlesStats.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createDraftArticle } from "@/lib/actions/article-create";

interface ArticlesStatsProps {
  lastCreditedMonth?: number;
  lastCreditedYear?: number;
  draftCount: number;
}

export default function ArticlesStats({ 
  lastCreditedMonth, 
  lastCreditedYear, 
  draftCount 
}: ArticlesStatsProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setIsCreating(true);
    setError(null);
    
    try {
      await createDraftArticle();
      // Редирект произойдёт автоматически
    } catch (err: any) {
      setError(err.message);
      setIsCreating(false);
    }
  };

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  let diff = 0;
  if (lastCreditedMonth && lastCreditedYear) {
    diff = (lastCreditedYear - currentYear) * 12 + (lastCreditedMonth - currentMonth);
  } else {
    diff = -1;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      {/* Карточка статуса Баланса */}
      <div className={`p-5 rounded-2xl border shadow-sm ${diff >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
        <p className="text-sm font-medium text-slate-500 mb-1">Статус расчетов</p>
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold ${diff >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
            {diff >= 0 ? `+${diff + 1}` : 'Долг'}
          </span>
          <span className="text-sm text-slate-600">
            {diff >= 0 ? 'мес. в запасе' : 'за текущий период'}
          </span>
        </div>
        <p className="text-xs mt-2 text-slate-500">
          {lastCreditedMonth ? `Оплачено до: ${lastCreditedMonth}.${lastCreditedYear}` : 'Нет одобренных статей'}
        </p>
      </div>

      {/* Карточка Черновиков */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
        <p className="text-sm font-medium text-slate-500 mb-1">Лимит черновиков</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${draftCount >= 2 ? 'bg-rose-500' : 'bg-slate-900'}`} 
              style={{ width: `${(draftCount / 2) * 100}%` }}
            />
          </div>
          <span className="font-mono font-bold text-slate-900">{draftCount} / 2</span>
        </div>
        {error && (
          <p className="text-xs text-rose-600 mt-2">{error}</p>
        )}
      </div>

      {/* Кнопка действия */}
      <div className="flex items-center justify-end">
        <button 
          onClick={handleCreate}
          disabled={draftCount >= 2 || isCreating}
          className="w-full md:w-auto h-full px-8 py-4 bg-blue-600 hover:bg-blue-700 transition-colors text-white
          rounded-2xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? "Создание..." : "Написать статью"}
        </button>
      </div>
    </div>
  );
}