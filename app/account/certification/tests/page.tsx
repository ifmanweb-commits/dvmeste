import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { BookOpen, CheckCircle, Lock, Loader2 } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import TestsListClient from '@/components/account/TestsListClient';
import CertificationHorNav from '@/components/account/CertificationHorNav';

export default async function CertificationTestsPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  // Получаем все активные тесты (Challenge type=TEST)
  const testChallenges = await prisma.challenge.findMany({
    where: {
      type: 'TEST',
      isActive: true,
    },
    include: {
      test: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Получаем все активные сертификации для фильтра
  const certifications = await prisma.certification.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Для каждого теста получаем статус пользователя и список сертификаций
  const testsWithStatus = await Promise.all(
    testChallenges.map(async (challenge) => {
      // Последняя успешная попытка
      const successfulAttempt = await prisma.challengeAttempt.findFirst({
        where: {
          userId: user.id,
          challengeId: challenge.id,
          passed: true,
        },
        orderBy: { finishedAt: 'desc' },
      });

      // Последняя попытка в процессе
      const inProgressAttempt = await prisma.challengeAttempt.findFirst({
        where: {
          userId: user.id,
          challengeId: challenge.id,
          status: 'IN_PROGRESS',
        },
        orderBy: { createdAt: 'desc' },
      });

      // Состояние пользователя (остаток попыток)
      const userState = await prisma.challengeUserState.findUnique({
        where: {
          challengeId_userId: {
            challengeId: challenge.id,
            userId: user.id,
          },
        },
      });

      // Находим все сертификации, в которых используется этот тест
      const requirements = await prisma.certificationRequirement.findMany({
        where: { challengeId: challenge.id },
        include: {
          certification: true,
        },
      });
      const certifications = requirements.map(r => r.certification);

      const isCompleted = !!successfulAttempt;
      const hasInProgress = !!inProgressAttempt;
      const baseAttempts = challenge.test?.freeAttempts ?? 0;
      const attemptsLeft = userState?.attemptsLeft ?? baseAttempts;

      return {
        ...challenge,
        isCompleted,
        hasInProgress,
        inProgressAttemptId: inProgressAttempt?.id,
        attemptsLeft,
        test: challenge.test ? {
          questionsCount: challenge.test.questionsCount,
          passingScore: challenge.test.passingScore,
          timeLimit: challenge.test.timeLimit,
        } : null,
        certifications,
      };
    })
  );

  // Получаем баланс пользователя
  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { balance: true },
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Заголовок страницы */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Тесты
          </h1>
        </div>

        {/* Навигационная панель */}
        <CertificationHorNav activeTab="tests" />

        {/* Список тестов */}
        <TestsListClient
          tests={testsWithStatus as any}
          certifications={certifications}
          userBalance={currentUser?.balance ?? 0}
        />
      </div>
    </div>
  );
}