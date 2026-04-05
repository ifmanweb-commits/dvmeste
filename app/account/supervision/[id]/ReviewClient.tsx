"use client";

import { useState } from "react";
import { ExternalLink, CheckCircle, XCircle, MinusCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface ReviewClientProps {
  submission: {
    id: string;
    videoUrl: string;
    transcriptUrl: string;
    challenge: {
      title: string;
      work: {
        instructions: string | null;
        requiredReviews: number;
        reviewsToPass: number;
      } | null;
    };
    psychologist: {
      fullName: string | null;
      email: string;
    };
  };
}

export default function ReviewClient({ submission }: ReviewClientProps) {
  const router = useRouter();
  const [verdict, setVerdict] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleReview = async (selectedVerdict: "APPROVED" | "REJECTED") => {
    if (selectedVerdict === "REJECTED" && !comment.trim()) {
      setError("При отклонении необходим комментарий");
      return;
    }

    setLoading("review");
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/supervision/submissions/${submission.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verdict: selectedVerdict,
          comment: selectedVerdict === "REJECTED" ? comment : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ошибка при проверке");
      }

      setSuccess("Работа проверена!");
      setTimeout(() => {
        router.push("/account/supervision");
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Отказаться от проверки? Работа вернётся в общий пул.")) return;

    setLoading("cancel");
    try {
      const res = await fetch(`/api/supervision/submissions/${submission.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ошибка при отказе");
      }

      router.push("/account/supervision");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Инфо о работе */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{submission.challenge.title}</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Требуется проверок:</span>
            <p className="text-gray-900">
              {submission.challenge.work?.requiredReviews || 1} (из них {submission.challenge.work?.reviewsToPass || 1} для сдачи)
            </p>
          </div>
        </div>
      </div>

      {/* Инструкция */}
      {submission.challenge.work?.instructions && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-amber-900 mb-2">Инструкция для супервизора</h3>
          <p className="text-amber-800 whitespace-pre-wrap">{submission.challenge.work.instructions}</p>
        </div>
      )}

      {/* Ссылки на материалы */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <a
          href={submission.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-blue-300 transition-colors flex items-center justify-between"
        >
          <div>
            <h3 className="font-semibold text-gray-900">Видео сессии</h3>
            <p className="text-sm text-gray-500 mt-1">Откроется в новом окне</p>
          </div>
          <ExternalLink className="w-5 h-5 text-gray-400" />
        </a>
        <a
          href={submission.transcriptUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-blue-300 transition-colors flex items-center justify-between"
        >
          <div>
            <h3 className="font-semibold text-gray-900">Расшифровка</h3>
            <p className="text-sm text-gray-500 mt-1">Откроется в новом окне</p>
          </div>
          <ExternalLink className="w-5 h-5 text-gray-400" />
        </a>
      </div>

      {/* Сообщения */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-green-800">
          {success}
        </div>
      )}

      {/* Кнопки действий */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Результат проверки</h3>
        
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => handleReview("APPROVED")}
            disabled={loading !== null}
            className="flex-1 min-w-[140px] px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading === "review" ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Одобрить
              </>
            )}
          </button>
          
          <button
            onClick={() => setVerdict("REJECTED")}
            disabled={loading !== null || verdict === "REJECTED"}
            className="flex-1 min-w-[140px] px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <XCircle className="w-5 h-5" />
            Отклонить
          </button>
          
          <button
            onClick={handleCancel}
            disabled={loading !== null}
            className="flex-1 min-w-[140px] px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading === "cancel" ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <MinusCircle className="w-5 h-5" />
                Отказаться
              </>
            )}
          </button>
        </div>

        {/* Поле комментария при отклонении */}
        {verdict === "REJECTED" && (
          <div className="border-t border-gray-200 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Комментарий для психолога (обязательно при отклонении)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Подробно опишите причины отклонения начиная с самых главных."
            />
            <div className="flex gap-4 mt-4">
              <button
                onClick={() => handleReview("REJECTED")}
                disabled={loading !== null || !comment.trim()}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading === "review" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Подтвердить отклонение
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setVerdict(null);
                  setComment("");
                }}
                disabled={loading !== null}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}