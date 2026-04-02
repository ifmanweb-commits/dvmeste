"use client";

import { useState } from "react";

export default function ManagementPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);

  const handleShuffle = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/shuffle-catalog", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true });
      } else {
        setResult({ error: data.error || "Ошибка при обновлении" });
      }
    } catch (error) {
      setResult({ error: "Ошибка сети" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Управление</h1>

      <div className="max-w-xl">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Каталог психологов
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Обновление случайного порядка отображения психологов в каталоге.
            Порядок обновляется автоматически ежедневно в 3:00.
          </p>

          <button
            onClick={handleShuffle}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#5858E2] text-white rounded-lg hover:bg-[#5858E2]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Обновление...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Обновить порядок психологов
              </>
            )}
          </button>

          {result && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              result.success 
                ? "bg-green-50 text-green-700" 
                : "bg-red-50 text-red-700"
            }`}>
              {result.success 
                ? "✅ Порядок психологов успешно обновлён" 
                : `❌ ${result.error}`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}