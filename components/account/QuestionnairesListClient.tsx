"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Play, ClipboardList, Award, ChevronDown } from "lucide-react";

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
  submissionStatus: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | null;
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
}

type StatusFilter = "all" | "completed" | "incomplete" | "pending";

export default function QuestionnairesListClient({ questionnaires, certifications }: QuestionnairesListClientProps) {
  const searchParams = useSearchParams();
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
      if (statusFilter === "incomplete" && q.isCompleted) return false;
      if (statusFilter === "pending" && q.submissionStatus !== 'PENDING' && q.submissionStatus !== 'IN_REVIEW') return false;

      return true;
    });
  }, [questionnaires, selectedCertificationId, statusFilter]);

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
              onClick={() => setStatusFilter("completed")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === "completed"
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Пройденные
            </button>
            <button
              onClick={() => setStatusFilter("incomplete")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === "incomplete"
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Непройденные
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === "pending"
                  ? "bg-yellow-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              На проверке
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
          filteredQuestionnaires.map((q, index) => {
            // Определяем цвет карточки по статусу
            const cardClasses = q.submissionStatus === 'APPROVED'
              ? "border-green-300 bg-green-50"
              : q.submissionStatus === 'REJECTED'
              ? "border-red-300 bg-red-50"
              : "border-gray-200 bg-white";

            // Определяем цвет номера
            const numberClasses = q.submissionStatus === 'APPROVED'
              ? "bg-green-200 text-green-800"
              : q.submissionStatus === 'REJECTED'
              ? "bg-red-200 text-red-800"
              : "bg-gray-100 text-gray-700";

            // Определяем цвет текста
            const titleClasses = q.submissionStatus === 'APPROVED' ? "text-green-900" : "text-gray-900";
            const descClasses = q.submissionStatus === 'APPROVED' ? "text-green-700" : "text-gray-600";
            const metaClasses = q.submissionStatus === 'APPROVED' ? "text-green-600" : "text-gray-500";

            // Определяем цвет бейджа сертификации
            const certBadgeClasses = q.submissionStatus === 'APPROVED'
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200";

            return (
              <div
                key={q.id}
                className={`overflow-hidden rounded-xl border shadow-sm ${cardClasses}`}
              >
                <div className="p-6">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Колонка 1: Номер */}
                    <div className="col-span-1">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${numberClasses}`}>
                        {index + 1}
                      </div>
                    </div>

                    {/* Колонка 2: Название и описание */}
                    <div className="col-span-5">
                      <h3 className={`text-lg font-medium ${titleClasses}`}>
                        {q.title}
                      </h3>
                      {q.description && (
                        <p className={`mt-1 text-sm whitespace-pre-wrap ${descClasses}`}>
                          {q.description}
                        </p>
                      )}
                      <div className={`mt-2 flex items-center gap-4 text-xs ${metaClasses}`}>
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
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${certBadgeClasses}`}
                            >
                              <Award className="mr-1 h-3 w-3" />
                              {cert.title}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Колонка 3: Статус */}
                    <div className="col-span-3">
                      {q.submissionStatus === 'APPROVED' ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Сдано
                        </span>
                      ) : q.submissionStatus === 'REJECTED' ? (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
                          Отклонено
                        </span>
                      ) : q.submissionStatus === 'PENDING' || q.submissionStatus === 'IN_REVIEW' ? (
                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
                          На проверке
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800">
                          Не начат
                        </span>
                      )}
                    </div>

                    {/* Колонка 4: Кнопка */}
                    <div className="col-span-3 flex justify-end">
                      {q.submissionStatus === 'APPROVED' ? (
                        <span className="inline-flex items-center rounded-full bg-green-200 px-4 py-2 text-sm font-medium text-green-800">
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Сдано
                        </span>
                      ) : q.submissionStatus === 'PENDING' || q.submissionStatus === 'IN_REVIEW' ? (
                        // На проверке - кнопку не показываем
                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-800">
                          На проверке
                        </span>
                      ) : q.submissionStatus === 'REJECTED' ? (
                        // Отклонено - показываем кнопку в зависимости от attemptsLeft
                        q.attemptsLeft > 0 ? (
                          <Link
                            href={`/account/challenge/${q.id}`}
                            className="inline-flex items-center rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]"
                          >
                            <Play className="mr-1 h-4 w-4" />
                            Начать
                          </Link>
                        ) : (
                          <Link
                            href={`/account/challenge/${q.id}`}
                            className="inline-flex items-center rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]"
                          >
                            <Play className="mr-1 h-4 w-4" />
                            Оплатить попытку
                          </Link>
                        )
                      ) : q.hasInProgress ? (
                        <Link
                          href={`/account/challenge/${q.id}?attempt=${q.inProgressAttemptId}`}
                          className="inline-flex items-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
                        >
                          <Play className="mr-1 h-4 w-4" />
                          Продолжить
                        </Link>
                      ) : (
                        <Link
                          href={`/account/challenge/${q.id}`}
                          className="inline-flex items-center rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]"
                        >
                          <Play className="mr-1 h-4 w-4" />
                          Начать
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}