"use client";

import { useState } from "react";
import { CheckCircle, XCircle, MinusCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface QuestionnaireReviewClientProps {
  submission: {
    id: string;
    answers: Array<{ questionIndex: number; answer: string }>;
    startedAt: string | null;
    submittedAt: string;
    challenge: {
      title: string;
      questionnaire: {
        instructionsForSupervisor: string | null;
        requiredReviews: number;
        reviewsToPass: number;
        questionsPool: string[];
      } | null;
    };
    psychologist: {
      fullName: string | null;
      email: string;
    };
  };
}

export default function QuestionnaireReviewClient({ submission }: QuestionnaireReviewClientProps) {
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
      const res = await fetch(`/api/supervision/questionnaires/${submission.id}/review`, {
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
      const res = await fetch(`/api/supervision/questionnaires/${submission.id}/cancel`, {
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

  const questionsPool = submission.challenge.questionnaire?.questionsPool || [];

  // Вычисляем метрики
  const totalCharacters = submission.answers.reduce((sum, item) => sum + (item.answer?.length || 0), 0);
  
  // Вычисляем время прохождения в минутах
  let timeSpentMinutes = 0;
  if (submission.startedAt) {
    const started = new Date(submission.startedAt).getTime();
    const submitted = new Date(submission.submittedAt).getTime();
    timeSpentMinutes = (submitted - started) / 1000 / 60;
  }
  
  // Вычисляем скорость набора (знаков в минуту)
  const typingSpeed = timeSpentMinutes > 0 ? Math.round(totalCharacters / timeSpentMinutes) : 0;
  
  // Определяем статус скорости
  let speedStatus: 'normal' | 'high' | 'veryHigh' = 'normal';
  let speedMessage = '';
  let speedColorClass = '';
  
  if (typingSpeed > 400) {
    speedStatus = 'veryHigh';
    speedMessage = 'Неправдоподобно высокая скорость набора текста';
    speedColorClass = 'bg-red-50 border-red-200 text-red-800';
  } else if (typingSpeed > 300) {
    speedStatus = 'high';
    speedMessage = 'Высокая скорость набора текста';
    speedColorClass = 'bg-amber-50 border-amber-200 text-amber-800';
  }

  // Форматируем время
  const formatTime = (minutes: number) => {
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes - mins) * 60);
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}ч ${remainingMins}м ${secs}с`;
    }
    return `${mins}м ${secs}с`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Инфо о работе */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{submission.challenge.title}</h2>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Требуется проверок:</span>
            <p className="text-gray-900">
              {submission.challenge.questionnaire?.requiredReviews || 1} (из них {submission.challenge.questionnaire?.reviewsToPass || 1} для сдачи)
            </p>
          </div>
          <div>
            <span className="text-gray-500">Время прохождения:</span>
            <p className="text-gray-900">{formatTime(timeSpentMinutes)}</p>
          </div>
          <div>
            <span className="text-gray-500">Объём ответов:</span>
            <p className="text-gray-900">{totalCharacters} зн.</p>
          </div>
        </div>
        
        {/* Блок скорости набора */}
        {typingSpeed > 0 && (
          <div className={`mt-4 rounded-lg border p-4 ${speedColorClass || 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Скорость набора текста:</span>
                <span className="ml-2 text-lg font-semibold">{typingSpeed} зн./мин</span>
              </div>
              {speedStatus !== 'normal' && (
                <span className="text-sm font-medium">{speedMessage}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Инструкция */}
      {submission.challenge.questionnaire?.instructionsForSupervisor && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-amber-900 mb-2">Инструкция для супервизора</h3>
          <p className="text-amber-800 whitespace-pre-wrap">{submission.challenge.questionnaire.instructionsForSupervisor}</p>
        </div>
      )}

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

      {/* Вопросы и ответы */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Ответы психолога</h3>
        
        <div className="space-y-4">
          {submission.answers.map((item, index) => {
            const question = questionsPool[item.questionIndex] || `Вопрос #${item.questionIndex + 1}`;
            return (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-700">
                    <span className="text-gray-500 mr-2">{index + 1}.</span>
                    {question}
                  </p>
                </div>
                <div className="px-4 py-3">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{item.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

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