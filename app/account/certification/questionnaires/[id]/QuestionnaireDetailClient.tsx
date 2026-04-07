"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, LockOpen, CheckCircle, XCircle, Clock, X, AlertCircle, FileText, MessageSquare } from "lucide-react";

interface Review {
  id: string;
  status: "APPROVED" | "REJECTED";
  comment: string | null;
  createdAt: string;
}

interface Submission {
  id: string;
  status: "IN_PROGRESS" | "SUBMITTED" | "REVIEWING" | "APPROVED" | "REJECTED";
  submittedAt: string;
  score: number | null;
  reviews: Review[];
}

interface Questionnaire {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  questionnaire: {
    instructionsForPsychologist: string | null;
    questionsCount: number;
    timeLimit: number | null;
  } | null;
}

interface QuestionnaireDetailClientProps {
  questionnaire: Questionnaire;
  submissions: Submission[];
  isUnlocked: boolean;
  hasActiveAttempt: boolean;
  activeSubmissionId: string | null;
  pendingSubmission: boolean;
  userBalance: number;
}

export default function QuestionnaireDetailClient({
  questionnaire,
  submissions,
  isUnlocked,
  hasActiveAttempt,
  activeSubmissionId,
  pendingSubmission,
  userBalance,
}: QuestionnaireDetailClientProps) {
  const router = useRouter();
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlockSuccess, setUnlockSuccess] = useState<string | null>(null);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  
  // Состояние модалки комментария
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState<{ text: string; submissionId: string } | null>(null);

  // Начало вопросника
  const startQuestionnaire = async () => {
    try {
      const res = await fetch(`/api/challenge/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: questionnaire.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ошибка при старте");
      }

      // Перенаправляем на страницу прохождения с submissionId
      // Для вопросников используем submissionId, а не attemptId
      const submissionId = data.submissionId || data.attemptId;
      if (!submissionId) {
        throw new Error("Не удалось получить ID попытки");
      }
      router.push(`/account/challenge/${questionnaire.id}?attempt=${submissionId}&type=QUESTIONNAIRE`);
    } catch (err: any) {
      setUnlockError(err.message);
    }
  };

  const closeUnlockModal = () => {
    setUnlockModalOpen(false);
    setUnlockError(null);
    setUnlockSuccess(null);
  };

  const handleUnlock = async () => {
    setIsUnlocking(true);
    setUnlockError(null);

    try {
      const response = await fetch(`/api/challenge/${questionnaire.id}/unlock`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUnlockSuccess("Попытка открыта!");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setUnlockError(data.error || "Ошибка при открытии");
      }
    } catch (error) {
      console.error("Unlock error:", error);
      setUnlockError("Ошибка соединения с сервером");
    } finally {
      setIsUnlocking(false);
    }
  };

  const formatPrice = (priceInKopecks: number | null): string => {
    if (priceInKopecks === null) return "0";
    return (priceInKopecks / 100).toFixed(0);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Открытие модалки комментария
  const openCommentModal = (comment: string, submissionId: string) => {
    setSelectedComment({ text: comment, submissionId });
    setCommentModalOpen(true);
  };

  // Закрытие модалки комментария
  const closeCommentModal = () => {
    setCommentModalOpen(false);
    setSelectedComment(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUBMITTED":
      case "REVIEWING":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
            <Clock className="h-3 w-3" />
            На проверке
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            <CheckCircle className="h-3 w-3" />
            Одобрено
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
            <XCircle className="h-3 w-3" />
            Отклонено
          </span>
        );
      default:
        return null;
    }
  };

  const instructions = questionnaire.questionnaire?.instructionsForPsychologist;
  const questionsCount = questionnaire.questionnaire?.questionsCount;
  const timeLimit = questionnaire.questionnaire?.timeLimit;

  return (
    <div className="space-y-6">
      {/* Кнопка действия или плашка */}
      {pendingSubmission ? (
        // Есть отправленный вопросник на проверке
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
              <AlertCircle className="h-6 w-6 text-gray-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                Ожидаем проверки супервизором
              </h3>
              <p className="mt-2 text-gray-600">
                Ваш вопросник отправлен на проверку. Вы получите уведомление о результате.
              </p>
            </div>
          </div>
        </div>
      ) : hasActiveAttempt ? (
        // Есть активная попытка - кнопка "Продолжить"
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Продолжить вопросник
          </h2>
          <p className="mb-4 text-gray-600">
            У вас есть активная попытка прохождения вопросника.
          </p>
          <Link
            href={`/account/challenge/${questionnaire.id}?attempt=${activeSubmissionId}&type=QUESTIONNAIRE`}
            className="inline-flex items-center rounded-lg bg-orange-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-orange-600"
          >
            <FileText className="mr-2 h-5 w-5" />
            Продолжить
          </Link>
        </div>
      ) : isUnlocked ? (
        // Разблокирован - кнопка "Начать"
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Начать вопросник
          </h2>
          <p className="mb-4 text-gray-600">
            {questionsCount && `Вопросов: ${questionsCount}. `}
            {timeLimit && `Время выполнения: ${timeLimit} минут.`}
          </p>
          <button
            onClick={startQuestionnaire}
            className="inline-flex items-center rounded-lg bg-[#5858E2] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]"
          >
            <FileText className="mr-2 h-5 w-5" />
            Начать вопросник
          </button>
        </div>
      ) : (
        // Заблокирован - плашка с оплатой
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
              <Lock className="h-6 w-6 text-gray-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                Попытка недоступна
              </h3>
              <p className="mt-2 text-gray-600">
                У вас нет доступных попыток для прохождения вопросника.
              </p>
              <p className="mt-1 text-gray-600">
                Стоимость открытия попытки —{" "}
                <span className="font-semibold text-gray-900">
                  {formatPrice(questionnaire.price || 0)} ₽
                </span>
              </p>

              <button
                onClick={() => setUnlockModalOpen(true)}
                className="mt-4 inline-flex items-center rounded-lg bg-green-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-green-600"
              >
                <LockOpen className="mr-2 h-4 w-4" />
                Оплатить попытку
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Инструкция для психолога */}
      {instructions && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Инструкция для психолога
          </h2>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700">
            {instructions}
          </div>
        </div>
      )}

      {/* Таблица попыток */}
      {submissions.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Попытки
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    №
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    Дата и время
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    Статус
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    Комментарий
                  </th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission, index) => {
                  const latestReview = submission.reviews[submission.reviews.length - 1];
                  const isRejected = submission.status === "REJECTED" || latestReview?.status === "REJECTED";
                  const comment = latestReview?.comment;
                  
                  return (
                    <tr
                      key={submission.id}
                      className="border-b border-gray-100 last:border-b-0"
                    >
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {submissions.length - index}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDateTime(submission.submittedAt)}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(submission.status)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {isRejected && comment ? (
                          <button
                            onClick={() => openCommentModal(comment, submission.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
                          >
                            <MessageSquare className="h-4 w-4" />
                            Комментарий супервизора
                          </button>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Модалка комментария */}
      {commentModalOpen && selectedComment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
              {/* Заголовок */}
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Комментарий супервизора
                </h3>
                <button
                  onClick={closeCommentModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Текст комментария с прокруткой */}
              <div className="max-h-96 overflow-y-auto rounded-lg bg-gray-50 p-4">
                <p className="whitespace-pre-wrap text-gray-800">
                  {selectedComment.text}
                </p>
              </div>

              {/* Кнопка закрытия */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeCommentModal}
                  className="rounded-lg bg-[#5858E2] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
      )}

      {/* Модалка оплаты */}
      {unlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            {/* Заголовок */}
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Открытие попытки
              </h3>
              <button
                onClick={closeUnlockModal}
                className="text-gray-400 hover:text-gray-600"
                disabled={isUnlocking}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Сообщения об успехе/ошибке */}
            {unlockSuccess && (
              <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">
                {unlockSuccess}
              </div>
            )}

            {unlockError && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                {unlockError}
              </div>
            )}

            {/* Контент модалки */}
            <div className="mb-6">
              <p className="mb-2 text-sm text-gray-600">
                Вопросник:{" "}
                <span className="font-medium text-gray-900">{questionnaire.title}</span>
              </p>
              <p className="mb-4 text-sm text-gray-600">
                Стоимость открытия:{" "}
                <span className="font-semibold text-gray-900 whitespace-nowrap">
                  {formatPrice(questionnaire.price || 0)} ₽
                </span>
              </p>

              {userBalance >= (questionnaire.price || 0) ? (
                <>
                  <p className="text-sm text-gray-700">
                    Вы можете открыть попытку прохождения вопросника.
                  </p>
                  <p className="mt-2 text-sm text-gray-700">
                    Стоимость открытия —{" "}
                    <span className="font-medium whitespace-nowrap">
                      {formatPrice(questionnaire.price || 0)} ₽
                    </span>
                    . Они будут списаны у вас со счета.
                  </p>
                  <p className="mt-4 text-sm font-medium text-gray-900">
                    Продолжить?
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-700">
                    Чтобы открыть попытку прохождения вопросника, нужно её открыть за{" "}
                    <span className="font-medium">
                      {formatPrice(questionnaire.price || 0)} рублей
                    </span>
                    .
                  </p>
                  <p className="mt-3 text-sm text-amber-700">
                    На вашем счете недостаточно денег. На балансе:{" "}
                    {formatPrice(userBalance)} ₽.
                  </p>
                  <p className="mt-2 text-sm text-gray-700">
                    Пополните счет и вы сможете открыть вопросник и пройти его.
                  </p>
                </>
              )}
            </div>

            {/* Кнопки */}
            <div className="flex gap-3">
              {userBalance >= (questionnaire.price || 0) ? (
                <>
                  <button
                    onClick={handleUnlock}
                    disabled={isUnlocking}
                    className="flex-1 rounded-lg bg-green-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isUnlocking ? "Открытие..." : (
                      <>
                        Открыть за{" "}
                        <span className="whitespace-nowrap">
                          {formatPrice(questionnaire.price || 0)} ₽
                        </span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={closeUnlockModal}
                    disabled={isUnlocking}
                    className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Пока не надо
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/account/balance"
                    className="flex-1 rounded-lg bg-[#5858E2] px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]"
                  >
                    Пополнить счет
                  </Link>
                  <button
                    onClick={closeUnlockModal}
                    className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                  >
                    Понятно
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}