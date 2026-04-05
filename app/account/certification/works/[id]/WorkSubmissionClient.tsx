"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, CheckCircle, XCircle, Clock, Upload, X } from "lucide-react";

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
  const [videoUrl, setVideoUrl] = useState("");
  const [transcriptUrl, setTranscriptUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlockSuccess, setUnlockSuccess] = useState<string | null>(null);

  // Отправка работы
  const submitWork = async () => {
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const res = await fetch(`/api/challenge/${work.id}/work/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl, transcriptUrl }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ошибка при отправке");
      }

      setSubmitMessage("Работа отправлена на проверку!");
      setVideoUrl("");
      setTranscriptUrl("");
      
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

  return (
    <div className="space-y-6">
      {/* Форма отправки или плашка блокировки */}
      {isUnlocked ? (
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
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
              <Lock className="h-6 w-6 text-gray-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                Работа заблокирована
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

              <button
                onClick={() => setUnlockModalOpen(true)}
                className="mt-4 inline-flex items-center rounded-lg bg-green-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-green-600"
              >
                <Lock className="mr-2 h-4 w-4" />
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
                  <th className="py-3 text-left text-sm font-medium text-gray-500">
                    №
                  </th>
                  <th className="py-3 text-left text-sm font-medium text-gray-500">
                    Дата и время
                  </th>
                  <th className="py-3 text-left text-sm font-medium text-gray-500">
                    Статус
                  </th>
                  <th className="py-3 text-left text-sm font-medium text-gray-500">
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
                      <td className="py-3 text-sm text-gray-900">
                        {submissions.length - index}
                      </td>
                      <td className="py-3 text-sm text-gray-600">
                        {formatDateTime(submission.submittedAt)}
                      </td>
                      <td className="py-3">
                        {getStatusBadge(submission.status)}
                      </td>
                      <td className="py-3 text-sm text-gray-600">
                        {isRejected && comment ? (
                          <div className="rounded-lg bg-red-50 p-2 text-red-800">
                            {comment}
                          </div>
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