"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, ArrowRight, ClipboardList, Award, ChevronDown, Lock, X, Clock } from "lucide-react";

interface Certification {
  id: string;
  slug: string;
  title: string;
}

interface QuestionnaireChallenge {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  type: "QUESTIONNAIRE";
  price: number | null;
  isCompleted: boolean;
  hasInProgress: boolean;
  inProgressAttemptId: string | null;
  submissionStatus: 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | null;
  attemptsLeft: number;
  questionnaire: {
    questionsCount: number;
    timeLimit: number | null;
    reviewPrice: number | null;
  } | null;
  certifications: Certification[];
}

interface QuestionnairesListClientProps {
  questionnaires: QuestionnaireChallenge[];
  certifications: Certification[];
  userBalance: number;
}

type StatusFilter = "all" | "submitted" | "completed";

export default function QuestionnairesListClient({ questionnaires, certifications, userBalance }: QuestionnairesListClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<QuestionnaireChallenge | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlockSuccess, setUnlockSuccess] = useState<string | null>(null);
  
  // Состояния фильтров
  const [selectedCertificationId, setSelectedCertificationId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Инициализация фильтров из URL параметров
  useEffect(() => {
    const certId = searchParams.get("certification");
    if (certId) {
      setSelectedCertificationId(certId);
    }
  }, [searchParams]);

  // Фильтрация вопросников на клиенте
  const filteredQuestionnaires = useMemo(() => {
    return questionnaires.filter((q) => {
      // Фильтр по сертификации
      if (selectedCertificationId !== "all") {
        const isInCertification = q.certifications.some(
          (cert) => cert.id === selectedCertificationId
        );
        if (!isInCertification) return false;
      }

      // Фильтр по статусу
      if (statusFilter === "completed" && !q.isCompleted) return false;
      if (statusFilter === "submitted" && q.submissionStatus !== 'SUBMITTED' && q.submissionStatus !== 'IN_REVIEW') return false;

      return true;
    });
  }, [questionnaires, selectedCertificationId, statusFilter]);

  const openUnlockModal = (questionnaire: QuestionnaireChallenge) => {
    setSelectedQuestionnaire(questionnaire);
    setUnlockModalOpen(true);
    setUnlockError(null);
    setUnlockSuccess(null);
  };

  const closeUnlockModal = () => {
    setUnlockModalOpen(false);
    setSelectedQuestionnaire(null);
    setUnlockError(null);
    setUnlockSuccess(null);
  };

  const handleUnlock = async () => {
    if (!selectedQuestionnaire) return;

    setIsUnlocking(true);
    setUnlockError(null);

    try {
      const response = await fetch(`/api/challenge/${selectedQuestionnaire.id}/unlock`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUnlockSuccess("Попытка разблокирована!");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setUnlockError(data.error || "Ошибка при разблокировке");
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

  if (questionnaires.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
        <ClipboardList className="mx-auto h-14 w-14 text-gray-300" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          Вопросники пока недоступны
        </h3>
        <p className="mt-2 text-gray-500">
          Вопросники для сертификации находятся в разработке
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Панель фильтров */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Выпадающий список сертификаций */}
          <div className="flex items-center gap-3">
            <label htmlFor="certification-filter" className="text-sm font-medium text-gray-700">
              Сертификация:
            </label>
            <div className="relative">
              <select
                id="certification-filter"
                value={selectedCertificationId}
                onChange={(e) => setSelectedCertificationId(e.target.value)}
                className="appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:border-gray-400 focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
              >
                <option value="all">Все сертификации</option>
                {certifications.map((cert) => (
                  <option key={cert.id} value={cert.id}>
                    {cert.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Кнопки-табы статусов */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter("all")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === "all"
                  ? "bg-[#5858E2] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setStatusFilter("submitted")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === "submitted"
                  ? "bg-yellow-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              На проверке
            </button>
            <button
              onClick={() => setStatusFilter("completed")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === "completed"
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Сдано
            </button>
          </div>
        </div>
      </div>

      {/* Список вопросников */}
      <div className="space-y-4">
        {filteredQuestionnaires.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
            <ClipboardList className="mx-auto h-14 w-14 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Вопросники не найдены
            </h3>
            <p className="mt-2 text-gray-500">
              По выбранным фильтрам нет доступных вопросников
            </p>
          </div>
        ) : (
          filteredQuestionnaires.map((q, index) => (
            <div
              key={q.id}
              className={`overflow-hidden rounded-xl border shadow-sm ${
                q.isCompleted
                  ? "border-green-300 bg-green-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="p-6">
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* Колонка 1: Номер и бейдж */}
                  <div className="col-span-2 flex flex-col items-center gap-2 pt-2">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${
                        q.isCompleted
                          ? "bg-green-200 text-green-800"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {index + 1}
                    </div>
                    {q.isCompleted ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Сдано
                      </span>
                    ) : q.submissionStatus === 'SUBMITTED' || q.submissionStatus === 'IN_REVIEW' ? (
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                        <Clock className="mr-1 h-3 w-3" />
                        На проверке
                      </span>
                    ) : null}
                  </div>

                  {/* Колонка 2: Название и описание */}
                  <div className="col-span-7">
                    <Link
                      href={`/account/certification/questionnaires/${q.id}`}
                      className={`text-lg font-medium hover:underline ${
                        q.isCompleted ? "text-green-900" : "text-gray-900"
                      }`}
                    >
                      {q.title}
                    </Link>
                    {q.description && (
                      <p
                        className={`mt-1 text-sm whitespace-pre-wrap ${
                          q.isCompleted ? "text-green-700" : "text-gray-600"
                        }`}
                      >
                        {q.description}
                      </p>
                    )}
                    <div className={`mt-2 flex items-center gap-4 text-xs ${
                      q.isCompleted ? "text-green-600" : "text-gray-500"
                    }`}>
                      <span>Вопросов: {q.questionnaire?.questionsCount}</span>
                      {q.questionnaire?.timeLimit && (
                        <span>Время: {q.questionnaire.timeLimit} мин</span>
                      )}
                      {q.questionnaire?.reviewPrice && (
                        <span>Цена проверки: {formatPrice(q.questionnaire.reviewPrice)} ₽</span>
                      )}
                    </div>
                    
                    {/* Сертификации */}
                    {q.certifications && q.certifications.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {q.certifications.map((cert) => (
                          <Link
                            key={cert.id}
                            href={`/account/certification/${cert.id}`}
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                              q.isCompleted
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            <Award className="mr-1 h-3 w-3" />
                            {cert.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Колонка 3: Кнопка */}
                  <div className="col-span-3 flex items-center justify-end">
                    {q.isCompleted ? (
                      <span className="inline-flex items-center rounded-full bg-green-200 px-4 py-2 text-sm font-medium text-green-800">
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Пройдено
                      </span>
                    ) : (
                      <Link
                        href={`/account/certification/questionnaires/${q.id}`}
                        className="inline-flex items-center rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]"
                      >
                        <ArrowRight className="mr-1 h-4 w-4" />
                        Перейти
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Модалка разблокировки */}
      {unlockModalOpen && selectedQuestionnaire && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            {/* Заголовок */}
            <div className="flex items-center justify-between mb-4">
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
              <p className="text-sm text-gray-600 mb-2">
                Испытание: <span className="font-medium text-gray-900">{selectedQuestionnaire.title}</span>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Стоимость открытия: <span className="font-semibold text-gray-900 whitespace-nowrap">{formatPrice(selectedQuestionnaire.price || 0)} ₽</span>
              </p>

              {userBalance >= (selectedQuestionnaire.price || 0) ? (
                <>
                  <p className="text-sm text-gray-700">
                    Вы можете открыть попытку прохождения испытания.
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    Стоимость открытия — <span className="font-medium whitespace-nowrap">{formatPrice(selectedQuestionnaire.price || 0)} ₽</span>.
                    Они будут списаны у вас со счета.
                  </p>
                  <p className="text-sm font-medium text-gray-900 mt-4">
                    Продолжить?
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-700">
                    Чтобы открыть попытку прохождения испытания, нужно её открыть за{" "}
                    <span className="font-medium">{formatPrice(selectedQuestionnaire.price || 0)} рублей</span>.
                  </p>
                  <p className="text-sm text-amber-700 mt-3">
                    На вашем счете недостаточно денег. На балансе: {formatPrice(userBalance)} ₽.
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    Пополните счет и вы сможете открыть испытание и пройти его.
                  </p>
                </>
              )}
            </div>

            {/* Кнопки */}
            <div className="flex gap-3">
              {userBalance >= (selectedQuestionnaire.price || 0) ? (
                <>
                  <button
                    onClick={handleUnlock}
                    disabled={isUnlocking}
                    className="flex-1 rounded-lg bg-green-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUnlocking ? "Открытие..." : (
                      <>
                        Открыть за <span className="whitespace-nowrap">{formatPrice(selectedQuestionnaire.price || 0)} ₽</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={closeUnlockModal}
                    disabled={isUnlocking}
                    className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
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