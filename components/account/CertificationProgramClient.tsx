"use client";

import { useState } from "react";
import Link from "next/link";
import { Award, CheckCircle, Circle, Lock, Play, X } from "lucide-react";

interface ChallengeData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  type: "TEST" | "WORK";
  price: number | null;
  test?: {
    questionsCount: number;
    passingScore: number;
  } | null;
}

interface Requirement {
  id: string;
  order: number;
  certificationId: string;
  challengeId: string;
  challenge: ChallengeData;
  isCompleted: boolean;
  hasInProgress: boolean;
  inProgressAttemptId: string | null;
  attemptsLeft: number;
}

interface CertificationProgramClientProps {
  certification: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    awards?: Array<{
      awardedAt: string;
    }>;
  };
  requirementsWithStatus: Requirement[];
  allCompleted: boolean;
  isCertified: boolean;
  userBalance: number;
}

export default function CertificationProgramClient({
  certification,
  requirementsWithStatus,
  allCompleted,
  isCertified,
  userBalance,
}: CertificationProgramClientProps) {
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Requirement["challenge"] | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlockSuccess, setUnlockSuccess] = useState<string | null>(null);

  const openUnlockModal = (requirement: Requirement) => {
    setSelectedChallenge(requirement.challenge);
    setUnlockModalOpen(true);
    setUnlockError(null);
    setUnlockSuccess(null);
  };

  const closeUnlockModal = () => {
    setUnlockModalOpen(false);
    setSelectedChallenge(null);
    setUnlockError(null);
    setUnlockSuccess(null);
  };

  const handleUnlock = async () => {
    if (!selectedChallenge) return;

    setIsUnlocking(true);
    setUnlockError(null);

    try {
      const response = await fetch(`/api/challenge/${selectedChallenge.id}/unlock`, {
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

  const formatPrice = (priceInKopecks: number): string => {
    return (priceInKopecks / 100).toFixed(0);
  };

  return (
    <div>
      {/* Хлебные крошки */}
      <nav className="mb-6 text-sm">
        <Link
          href="/account/certification"
          className="text-gray-600 hover:text-gray-900"
        >
          Сертификация
        </Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-900">{certification.title}</span>
      </nav>

      <div className="mb-8">
        <div className="flex items-start gap-4">
          {isCertified ? (
            <CheckCircle className="h-12 w-12 text-green-500" />
          ) : (
            <Award className="h-12 w-12 text-blue-500" />
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {certification.title}
            </h1>
            {certification.description && (
              <p className="mt-2 text-gray-600">{certification.description}</p>
            )}
            {isCertified && certification.awards && certification.awards.length > 0 && (
              <p className="mt-2 text-sm text-green-600">
                ✓ Сертификация пройдена{" "}
                {new Date(certification.awards[0].awardedAt).toLocaleDateString("ru-RU")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Список требований */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Программа сертификации
        </h2>

        {requirementsWithStatus.map((req, index) => (
          <div
            key={req.id}
            className={`overflow-hidden rounded-xl border shadow-sm ${
              req.isCompleted
                ? "border-green-300 bg-green-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="p-6">
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Колонка 1: Номер */}
                <div className="col-span-1">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${
                      req.isCompleted
                        ? "bg-green-200 text-green-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {index + 1}
                  </div>
                </div>

                {/* Колонка 2: Название и описание */}
                <div className="col-span-5">
                  <h3
                    className={`text-lg font-medium ${
                      req.isCompleted ? "text-green-900" : "text-gray-900"
                    }`}
                  >
                    {req.challenge.title}
                  </h3>
                  {req.challenge.description && (
                    <p
                      className={`mt-1 text-sm ${
                        req.isCompleted ? "text-green-700" : "text-gray-600"
                      }`}
                    >
                      {req.challenge.description}
                    </p>
                  )}
                  <div
                    className={`mt-2 flex items-center gap-4 text-xs ${
                      req.isCompleted ? "text-green-600" : "text-gray-500"
                    }`}
                  >
                    <span>
                      {req.challenge.type === "TEST" ? "Тест" : "Квалификационная работа"}
                    </span>
                    {req.challenge.type === "TEST" && (
                      <>
                        <span>Вопросы: {req.challenge.test?.questionsCount}</span>
                        <span>Проходной балл: {req.challenge.test?.passingScore}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Колонка 3: Бейдж с попытками */}
                <div className="col-span-3">
                  {req.attemptsLeft > 0 ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                      Попыток осталось: {req.attemptsLeft}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
                      Заблокировано
                    </span>
                  )}
                </div>

                {/* Колонка 4: Кнопка */}
                <div className="col-span-3 flex justify-end">
                  {req.isCompleted ? (
                    <span className="inline-flex items-center rounded-full bg-green-200 px-4 py-2 text-sm font-medium text-green-800">
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Пройдено
                    </span>
                  ) : req.hasInProgress ? (
                    <Link
                      href={`/account/challenge/${req.challenge.id}?attempt=${req.inProgressAttemptId}`}
                      className="inline-flex items-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
                    >
                      <Play className="mr-1 h-4 w-4" />
                      Продолжить
                    </Link>
                  ) : req.attemptsLeft > 0 ? (
                    <Link
                      href={`/account/challenge/${req.challenge.id}`}
                      className="inline-flex items-center rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]"
                    >
                      <Play className="mr-1 h-4 w-4" />
                      {req.challenge.type === "WORK" ? "Прислать" : "Начать"}
                    </Link>
                  ) : (
                    <button
                      onClick={() => openUnlockModal(req)}
                      className="inline-flex items-center rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600"
                    >
                      <Lock className="mr-1 h-4 w-4" />
                      Разблокировать
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Итоговый блок */}
      {allCompleted && !isCertified && (
        <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-6">
          <div className="flex items-center gap-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-green-900">
                Поздравляем! Все испытания пройдены
              </h3>
              <p className="mt-1 text-green-700">
                Вы выполнили все требования программы.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Модалка разблокировки */}
      {unlockModalOpen && selectedChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            {/* Заголовок */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Разблокировка попытки
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
                Испытание: <span className="font-medium text-gray-900">{selectedChallenge.title}</span>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Стоимость разблокировки: <span className="font-semibold text-gray-900 whitespace-nowrap">{formatPrice(selectedChallenge.price || 0)} ₽</span>
              </p>

              {userBalance >= (selectedChallenge.price || 0) ? (
                <>
                  <p className="text-sm text-gray-700">
                    Вы можете разблокировать попытку прохождения испытания.
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    Стоимость разблокировки — <span className="font-medium whitespace-nowrap">{formatPrice(selectedChallenge.price || 0)} ₽</span>.
                    Они будут списаны у вас со счета.
                  </p>
                  <p className="text-sm font-medium text-gray-900 mt-4">
                    Продолжить?
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-700">
                    Чтобы разблокировать попытку прохождения испытания, нужно её разблокировать за{" "}
                    <span className="font-medium">{formatPrice(selectedChallenge.price || 0)} рублей</span>.
                  </p>
                  <p className="text-sm text-amber-700 mt-3">
                    На вашем счете недостаточно денег. На балансе: {formatPrice(userBalance)} ₽.
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    Пополните счет и вы сможете разблокировать испытание и пройти его.
                  </p>
                </>
              )}
            </div>

            {/* Кнопки */}
            <div className="flex gap-3">
              {userBalance >= (selectedChallenge.price || 0) ? (
                <>
                  <button
                    onClick={handleUnlock}
                    disabled={isUnlocking}
                    className="flex-1 rounded-lg bg-green-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUnlocking ? "Разблокировка..." : (
                      <>
                        Разблокировать за <span className="whitespace-nowrap">{formatPrice(selectedChallenge.price || 0)} ₽</span>
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