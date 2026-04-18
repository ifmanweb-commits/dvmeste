"use client";

import { useState, useEffect } from "react";

interface ConsentDocument {
  id: string;
  version: string;
  documentUrl: string | null;
  content: string;
  validFrom: string;
  isActive: boolean;
  createdAt: string;
}

export default function PrivacyPage() {
  const [document, setDocument] = useState<ConsentDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocument = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/consent-document");
        if (!response.ok) {
          throw new Error("Ошибка при загрузке данных");
        }
        const data = await response.json();
        setDocument(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Неизвестная ошибка");
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5858E2] mx-auto mb-4" />
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">❌ {error || "Политика не найдена"}</p>
          <p className="text-gray-500">Попробуйте позже</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Заголовок */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Политика обработки персональных данных
          </h1>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span className="font-medium">Версия:</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                {document.version}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Действует с:</span>
              <span>{formatDate(document.validFrom)}</span>
            </div>
          </div>
        </div>

        {/* Текст политики */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="prose prose-lg max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {document.content}
            </div>
          </div>
        </div>

        {/* Футер */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Документ создан: {formatDate(document.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}