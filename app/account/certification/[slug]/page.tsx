import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { Award, CheckCircle, Circle, Lock, Play } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CertificationProgramPage({ params }: PageProps) {
  const { slug } = await params;
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  // Получаем сертификацию по slug
  const certification = await prisma.certification.findUnique({
    where: { slug, isActive: true },
    include: {
      requirements: {
        include: {
          challenge: {
            include: {
              test: true,
            },
          },
        },
        orderBy: { order: 'asc' },
      },
      awards: {
        where: { userId: user.id },
      },
    },
  });

  if (!certification) {
    notFound();
  }

  // Проверяем, получена ли уже эта сертификация
  const isCertified = certification.awards.length > 0;

  // Для каждого требования получаем статус
  const requirementsWithStatus = await Promise.all(
    certification.requirements.map(async (req) => {
      // Получаем последнюю успешную попытку
      const successfulAttempt = await prisma.challengeAttempt.findFirst({
        where: {
          userId: user.id,
          challengeId: req.challengeId,
          passed: true,
        },
        orderBy: { finishedAt: 'desc' },
      });

      // Получаем последнюю незавершённую попытку
      const inProgressAttempt = await prisma.challengeAttempt.findFirst({
        where: {
          userId: user.id,
          challengeId: req.challengeId,
          status: 'IN_PROGRESS',
        },
        orderBy: { createdAt: 'desc' },
      });

      // Получаем состояние пользователя (остаток попыток)
      const userState = await prisma.challengeUserState.findUnique({
        where: {
          challengeId_userId: {
            challengeId: req.challengeId,
            userId: user.id,
          },
        },
      });

      const isCompleted = !!successfulAttempt;
      const hasInProgress = !!inProgressAttempt;
      const attemptsLeft = userState?.attemptsLeft ?? (req.challenge.test?.freeAttempts || 0);

      return {
        ...req,
        isCompleted,
        hasInProgress,
        inProgressAttemptId: inProgressAttempt?.id,
        attemptsLeft,
      };
    })
  );

  // Проверяем, все ли требования выполнены
  const allCompleted = requirementsWithStatus.every((req) => req.isCompleted);

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
            {isCertified && (
              <p className="mt-2 text-sm text-green-600">
                ✓ Сертификация пройдена{' '}
                {new Date(certification.awards[0].awardedAt).toLocaleDateString('ru-RU')}
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
                ? 'border-green-300 bg-green-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${
                    req.isCompleted
                      ? 'bg-green-200 text-green-800'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <h3 className={`text-lg font-medium ${
                      req.isCompleted ? 'text-green-900' : 'text-gray-900'
                    }`}>
                      {req.challenge.title}
                    </h3>
                    {req.challenge.description && (
                      <p className={`mt-1 text-sm ${
                        req.isCompleted ? 'text-green-700' : 'text-gray-600'
                      }`}>
                        {req.challenge.description}
                      </p>
                    )}
                    <div className={`mt-2 flex items-center gap-4 text-xs ${
                      req.isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      <span>
                        {req.challenge.type === 'TEST' ? 'Тест' : 'Квалификационная работа'}
                      </span>
                      {req.challenge.test && (
                        <>
                          <span>
                            Вопросы: {req.challenge.test.questionsCount}
                          </span>
                          <span>
                            Проходной балл: {req.challenge.test.passingScore}
                          </span>
                          <span>
                            Попыток осталось: {req.attemptsLeft}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  {req.isCompleted ? (
                    <span className="inline-flex items-center rounded-full bg-green-200 px-4 py-2 text-sm font-medium text-green-800">
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Пройдено
                    </span>
                  ) : req.hasInProgress ? (
                    <Link
                      href={`/account/challenge/${req.challenge.slug}?attempt=${req.inProgressAttemptId}`}
                      className="inline-flex items-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
                    >
                      <Play className="mr-1 h-4 w-4" />
                      Продолжить
                    </Link>
                  ) : req.attemptsLeft > 0 ? (
                    <Link
                      href={`/account/challenge/${req.challenge.slug}`}
                      className="inline-flex items-center rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]"
                    >
                      <Play className="mr-1 h-4 w-4" />
                      Начать
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="inline-flex items-center rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400"
                    >
                      <Lock className="mr-1 h-4 w-4" />
                      Попытки исчерпаны
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
                Вы выполнили все требования программы. Сертификат будет выдан автоматически.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}