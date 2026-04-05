"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, LockOpen, CheckCircle, XCircle, Clock, Upload, X, AlertCircle, Video, FileText, MessageSquare } from "lucide-react";

interface Review {
  id: string;
  status: "APPROVED" | "REJECTED";
  comment: string | null;
  createdAt: string;
  supervisor: {
    id: string;
    name: string;
  };
}

interface Submission {
  id: string;
  videoUrl: string;
  transcriptUrl: string;
  status: "SUBMITTED" | "REVIEWING" | "APPROVED" | "REJECTED";
  submittedAt: string;
  reviews: Review[];
}

interface Work {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
}

interface WorkSubmissionClientProps {
  work: Work;
  submissions: Submission[];
  isUnlocked: boolean;
  userBalance: number;
}

export default function WorkSubmissionClient({
  work,
  submissions,
  isUnlocked,
  userBalance,
}: WorkSubmissionClientProps) {
  // Находим последнюю отправку в статусе SUBMITTED или REVIEWING
  const pendingSubmission = submissions.find(
    (s) => s.status === "SUBMITTED" || s.status === "REVIEWING"
  );

  const [videoUrl, setVideoUrl] = useState(pendingSubmission?.videoUrl || "");
  const [transcriptUrl, setTranscriptUrl] = useState(pendingSubmission?.transcriptUrl || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlockSuccess, setUnlockSuccess] = useState<string | null>(null);

  // Состояние режима редактирования
  const [isEditing, setIsEditing] = useState(false);

  // Состояние модалки комментария
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState<{ text: string; submissionId: string } | null>(null);

  // Отправка работы (новая или редактирование)
  const submitWork = async () => {
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const res = await fetch(`/api/challenge/${work.id}/work/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          videoUrl, 
          transcriptUrl,
          submissionId: pendingSubmission?.id, // Если есть - это редактирование
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ошибка при отправке");
      }

      setSubmitMessage(pendingSubmission ? "Ссылки обновлены!" : "Работа отправлена на проверку!");
      setVideoUrl("");
      setTranscriptUrl("");
      setIsEditing(false);
      
      // Перезагрузка страницы через 1.5 секунды
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setSubmitMessage(err.message);
    } finally {
      setIsSubmitting(false);
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
      const response = await fetch(`/api/challenge/${work.id}/unlock`, {
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

  const formatPrice = (priceInKopecks: number): string => {
    return (priceInKopecks / 100).toFixed(0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUBMITTED":
      case "REVIEWING":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
            <Clock className="h-3 w-3" />
            Проверяется
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            <CheckCircle className="h-3 w-3" />
            Принята
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
            <XCircle className="h-3 w-3" />
            Провалена
          </span>
        );
      default:
        return null;
    }
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

  // Отмена редактирования
  const handleCancelEdit = () => {
    setIsEditing(false);
    setVideoUrl("");
    setTranscriptUrl("");
    setSubmitMessage(null);
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

  return (
    <div className="space-y-6">
      {/* Форма отправки или плашка блокировки */}
      {pendingSubmission ? (
        // Есть отправленная работа на проверке
        isEditing ? (
          // Режим редактирования
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Исправить ссылки
            </h2>

            {submitMessage && (
              <div
                className={`mb-4 rounded-lg p-4 ${
                  submitMessage.includes("ошибка") ||
                  submitMessage.includes("Failed") ||
                  submitMessage.includes("Ошибка")
                    ? "bg-red-50 text-red-800"
                    : "bg-green-50 text-green-800"
                }`}
              >
                {submitMessage}
              </div>
            )}

            <div className="mb-4">
              <label
                htmlFor="videoUrl"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Ссылка на видео
              </label>
              <input
                id="videoUrl"
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
                placeholder="https://..."
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="transcriptUrl"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Ссылка на расшифровку
              </label>
              <input
                id="transcriptUrl"
                type="url"
                value={transcriptUrl}
                onChange={(e) => setTranscriptUrl(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
                placeholder="https://..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={submitWork}
                disabled={
                  isSubmitting || !videoUrl.trim() || !transcriptUrl.trim()
                }
                className="inline-flex items-center rounded-lg bg-[#5858E2] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Сохранение..." : "Сохранить изменения"}
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={isSubmitting}
                className="inline-flex items-center rounded-lg bg-gray-100 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          // Плашка "Повторная отправка недоступна"
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
                <AlertCircle className="h-6 w-6 text-gray-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  Повторная отправка работы недоступна
                </h3>
                <p className="mt-2 text-gray-600">
                  Вы уже отправили работу на проверку. Дождитесь результатов.
                </p>
                <p className="mt-1 text-gray-600">
                  Когда супервизоры проверят вашу работу - вы получите уведомление.
                </p>
                <p className="mt-1 text-gray-600">
                  Если вы считаете, что послали неправильные ссылки - можете исправить их.
                </p>

                <button
                  onClick={() => {
                    setVideoUrl(pendingSubmission.videoUrl);
                    setTranscriptUrl(pendingSubmission.transcriptUrl);
                    setIsEditing(true);
                  }}
                  className="mt-4 inline-flex items-center rounded-lg bg-[#5858E2] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]"
                >
                  <LockOpen className="mr-2 h-4 w-4" />
                  Исправить ссылки
                </button>
              </div>
            </div>
          </div>
        )
      ) : isUnlocked ? (
        // Нет отправленной работы и разблокирована - показываем форму
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Сдать работу
          </h2>

          {submitMessage && (
            <div
              className={`mb-4 rounded-lg p-4 ${
                submitMessage.includes("ошибка") ||
                submitMessage.includes("Failed") ||
                submitMessage.includes("Ошибка")
                  ? "bg-red-50 text-red-800"
                  : "bg-green-50 text-green-800"
              }`}
            >
              {submitMessage}
            </div>
          )}

          <div className="mb-4">
            <label
              htmlFor="videoUrl"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Ссылка на видео
            </label>
            <input
              id="videoUrl"
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
              placeholder="https://..."
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="transcriptUrl"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Ссылка на расшифровку
            </label>
            <input
              id="transcriptUrl"
              type="url"
              value={transcriptUrl}
              onChange={(e) => setTranscriptUrl(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
              placeholder="https://..."
            />
          </div>

          <button
            onClick={submitWork}
            disabled={
              isSubmitting || !videoUrl.trim() || !transcriptUrl.trim()
            }
            className="inline-flex items-center rounded-lg bg-[#5858E2] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Отправка..." : "Отправить"}
          </button>
        </div>
      ) : (
        // Заблокирована - плашка с оплатой
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
              <Lock className="h-6 w-6 text-gray-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                Проверка работы недоступна
              </h3>
              <p className="mt-2 text-gray-600">
                Чтобы отправить работу, нужно оплатить её проверку супервизорами.
              </p>
              <p className="mt-1 text-gray-600">
                Стоимость проверки —{" "}
                <span className="font-semibold text-gray-900">
                  {formatPrice(work.price || 0)} ₽
                </span>
              </p>
              <p className="mt-1 text-gray-600">
                После оплаты вы сможете отправить работу на проверку.
              </p>

              <button
                onClick={() => setUnlockModalOpen(true)}
                className="mt-4 inline-flex items-center rounded-lg bg-green-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-green-600"
              >
                <LockOpen className="mr-2 h-4 w-4" />
                Оплатить проверку
              </button>
            </div>
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
                    Ссылки
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
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <a
                            href={submission.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100 transition-colors"
                            title="Видео"
                          >
                            <Video className="h-4 w-4" />
                          </a>
                          <a
                            href={submission.transcriptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-lg bg-green-50 p-2 text-green-600 hover:bg-green-100 transition-colors"
                            title="Текст"
                          >
                            <FileText className="h-4 w-4" />
                          </a>
                        </div>
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
                Работа:{" "}
                <span className="font-medium text-gray-900">{work.title}</span>
              </p>
              <p className="mb-4 text-sm text-gray-600">
                Стоимость открытия:{" "}
                <span className="font-semibold text-gray-900 whitespace-nowrap">
                  {formatPrice(work.price || 0)} ₽
                </span>
              </p>

              {userBalance >= (work.price || 0) ? (
                <>
                  <p className="text-sm text-gray-700">
                    Вы можете открыть попытку отправки работы.
                  </p>
                  <p className="mt-2 text-sm text-gray-700">
                    Стоимость открытия —{" "}
                    <span className="font-medium whitespace-nowrap">
                      {formatPrice(work.price || 0)} ₽
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
                    Чтобы открыть попытку отправки работы, нужно её открыть за{" "}
                    <span className="font-medium">
                      {formatPrice(work.price || 0)} рублей
                    </span>
                    .
                  </p>
                  <p className="mt-3 text-sm text-amber-700">
                    На вашем счете недостаточно денег. На балансе:{" "}
                    {formatPrice(userBalance)} ₽.
                  </p>
                  <p className="mt-2 text-sm text-gray-700">
                    Пополните счет и вы сможете открыть работу и отправить её на
                    проверку.
                  </p>
                </>
              )}
            </div>

            {/* Кнопки */}
            <div className="flex gap-3">
              {userBalance >= (work.price || 0) ? (
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
                          {formatPrice(work.price || 0)} ₽
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