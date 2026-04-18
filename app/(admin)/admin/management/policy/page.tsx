"use client";

import { useState, useEffect } from "react";
import HorNav from "../HorNav";

interface ConsentDocument {
  id: string;
  version: string;
  documentUrl: string | null;
  content: string;
  validFrom: string;
  isActive: boolean;
  createdAt: string;
}

export default function PolicyPage() {
  const [documents, setDocuments] = useState<ConsentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Форма
  const [version, setVersion] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [content, setContent] = useState("");
  const [validFrom, setValidFrom] = useState("");

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/consent-documents");
      if (!response.ok) {
        throw new Error("Ошибка при загрузке данных");
      }
      const data = await response.json();
      setDocuments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/admin/consent-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version,
          documentUrl: documentUrl || null,
          content,
          validFrom: validFrom || new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка при сохранении");
      }

      setSuccessMessage("Политика успешно обновлена");
      setIsModalOpen(false);
      // Очистка формы
      setVersion("");
      setDocumentUrl("");
      setContent("");
      setValidFrom("");
      // Перезагрузка списка
      fetchDocuments();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setSubmitting(false);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
    setSubmitError(null);
    setSuccessMessage(null);
    // Устанавливаем дату по умолчанию - сегодня
    const today = new Date().toISOString().split("T")[0];
    setValidFrom(today);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSubmitError(null);
    setSuccessMessage(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Политика обработки персональных данных</h1>
        <p className="text-gray-500 mt-1">История изменений политики</p>

        {/* Вкладки */}
        <HorNav />
      </div>

      {/* Кнопки */}
      <div className="mt-6 mb-6 flex gap-3">
        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#5858E2] text-white rounded-lg hover:bg-[#5858E2]/90 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Обновить политику
        </button>
        
        <a
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Посмотреть политику
        </a>
      </div>

      {/* Сообщения об успехе/ошибке */}
      {successMessage && (
        <div className="mb-4 p-3 rounded-lg text-sm bg-green-50 text-green-700">
          ✅ {successMessage}
        </div>
      )}

      {/* Таблица политик */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Загрузка...</div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-red-50 text-red-700">❌ {error}</div>
      ) : documents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Политики ещё не созданы</div>
      ) : (
        <div className="overflow-hidden border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Версия
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата действия
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата создания
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((doc) => (
                <tr key={doc.id} className={doc.isActive ? "bg-green-50" : ""}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {doc.version}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(doc.validFrom)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {doc.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Активная
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Архив
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(doc.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Модальное окно */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Затемнение фона */}
            <div
              className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75"
              onClick={closeModal}
              aria-hidden="true"
            />

            {/* Контент модального окна */}
            <div className="relative inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg z-[101]">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Обновить политику
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Версия */}
                <div>
                  <label htmlFor="version" className="block text-sm font-medium text-gray-700 mb-1">
                    Версия *
                  </label>
                  <input
                    id="version"
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="1.0"
                    required
                    pattern="\d+\.\d+"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5858E2]"
                  />
                  <p className="mt-1 text-xs text-gray-500">Формат: X.Y (например, 1.0, 2.1)</p>
                </div>

                {/* URL документа (опционально) */}
                <div>
                  <label htmlFor="documentUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    URL документа
                  </label>
                  <input
                    id="documentUrl"
                    type="text"
                    value={documentUrl}
                    onChange={(e) => setDocumentUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5858E2]"
                  />
                </div>

                {/* Текст политики */}
                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                    Текст политики *
                  </label>
                  <textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={8}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5858E2]"
                  />
                </div>

                {/* Дата действия */}
                <div>
                  <label htmlFor="validFrom" className="block text-sm font-medium text-gray-700 mb-1">
                    Дата действия *
                  </label>
                  <input
                    id="validFrom"
                    type="date"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5858E2]"
                  />
                </div>

                {/* Ошибки */}
                {submitError && (
                  <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700">
                    ❌ {submitError}
                  </div>
                )}

                {/* Кнопки */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#5858E2] rounded-md hover:bg-[#5858E2]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Сохранение..." : "Сохранить"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}