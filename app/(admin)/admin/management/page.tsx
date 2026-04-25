"use client";

import { useState, useEffect } from "react";
import HorNav from "./HorNav";

export default function ManagementPage() {
  const [shuffleLoading, setShuffleLoading] = useState(false);
  const [recalculateLoading, setRecalculateLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [shuffleResult, setShuffleResult] = useState<{ success?: boolean; error?: string } | null>(null);
  const [recalculateResult, setRecalculateResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);
  const [backupResult, setBackupResult] = useState<{ success?: boolean; error?: string } | null>(null);
  const [lastBackup, setLastBackup] = useState<{ timestamp: string; filename: string } | null>(null);

  const handleShuffle = async () => {
    setShuffleLoading(true);
    setShuffleResult(null);

    try {
      const response = await fetch("/api/admin/shuffle-catalog", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setShuffleResult({ success: true });
      } else {
        setShuffleResult({ error: data.error || "Ошибка при обновлении" });
      }
    } catch (error) {
      setShuffleResult({ error: "Ошибка сети" });
    } finally {
      setShuffleLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setRecalculateLoading(true);
    setRecalculateResult(null);

    try {
      const response = await fetch("/api/admin/recalculate-article-bonus", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setRecalculateResult({ success: true, message: data.message });
      } else {
        setRecalculateResult({ error: data.error || "Ошибка при пересчёте" });
      }
    } catch (error) {
      setRecalculateResult({ error: "Ошибка сети" });
    } finally {
      setRecalculateLoading(false);
    }
  };

  const handleBackup = async () => {
    setBackupLoading(true);
    setBackupResult(null);

    try {
      const response = await fetch("/api/admin/backup-database", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setBackupResult({ success: true });
        // Обновляем информацию о последнем бекапе
        setLastBackup({
          timestamp: new Date().toLocaleString("ru-RU"),
          filename: data.filename
        });
      } else {
        setBackupResult({ error: data.error || "Ошибка при создании бекапа" });
      }
    } catch (error) {
      setBackupResult({ error: "Ошибка сети" });
    } finally {
      setBackupLoading(false);
    }
  };

  // Загрузка информации о последнем бекапе при монтировании
  useEffect(() => {
    fetch("/api/admin/backup-database")
      .then(res => res.json())
      .then(data => {
        if (data.lastBackup) {
          setLastBackup({
            timestamp: data.lastBackup.timestamp,
            filename: data.lastBackup.filename
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Управление</h1>
        <p className="text-gray-500 mt-1">Настройки и утилиты</p>

        {/* Вкладки */}
        <HorNav />
      </div>

      <div className="mt-6 max-w-xl space-y-6">
        {/* Карточка 1: Каталог психологов */}
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
            disabled={shuffleLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#5858E2] text-white rounded-lg hover:bg-[#5858E2]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {shuffleLoading ? (
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

          {shuffleResult && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              shuffleResult.success 
                ? "bg-green-50 text-green-700" 
                : "bg-red-50 text-red-700"
            }`}>
              {shuffleResult.success 
                ? "✅ Порядок психологов успешно обновлён" 
                : `❌ ${shuffleResult.error}`}
            </div>
          )}
        </div>

        {/* Карточка 2: Пересчёт баллов за статьи */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Баллы за статьи
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Пересчёт баллов за статьи на основе их возраста.
            Баллы пересчитываются автоматически ежедневно в 3:00.
          </p>

          <button
            onClick={handleRecalculate}
            disabled={recalculateLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#5858E2] text-white rounded-lg hover:bg-[#5858E2]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {recalculateLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Пересчёт...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Пересчитать баллы за статьи
              </>
            )}
          </button>

          {recalculateResult && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              recalculateResult.success 
                ? "bg-green-50 text-green-700" 
                : "bg-red-50 text-red-700"
            }`}>
              {recalculateResult.success 
                ? `✅ ${recalculateResult.message}` 
                : `❌ ${recalculateResult.error}`}
            </div>
          )}
        </div>

        {/* Карточка 3: Бекап базы данных */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            База данных
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Резервное копирование базы данных.
            Бекапы создаются автоматически ежедневно в 3:30.
          </p>

          {/* Информация о последнем бекапе */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Последний бекап:</p>
            {lastBackup ? (
              <p className="text-sm font-medium text-gray-900 mt-1">
                📁 {lastBackup.timestamp}
              </p>
            ) : (
              <p className="text-sm text-gray-400 mt-1">
                Бекапы ещё не создавались
              </p>
            )}
          </div>

          <button
            onClick={handleBackup}
            disabled={backupLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#5858E2] text-white rounded-lg hover:bg-[#5858E2]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {backupLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Создание бекапа...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Сделать бекап БД
              </>
            )}
          </button>

          {backupResult && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              backupResult.success 
                ? "bg-green-50 text-green-700" 
                : "bg-red-50 text-red-700"
            }`}>
              {backupResult.success 
                ? "✅ Бекап успешно создан" 
                : `❌ ${backupResult.error}`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}