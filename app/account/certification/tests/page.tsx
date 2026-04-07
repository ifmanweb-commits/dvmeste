import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Award, FileText, FileBadge, CheckCircle, Lock, Loader2, ClipboardList } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import TestsListClient from '@/components/account/TestsListClient';

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
        <nav className="mb-8 border-b border-gray-200">
          <ul className="flex gap-6">
            <li>
              <Link
                href="/account/certification"
                className="inline-flex items-center gap-2 border-b-2 border-transparent pb-3 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <Award className="h-4 w-4" />
                Сертификации
              </Link>
            </li>
            <li>
              <Link
                href="/account/certification/tests"
                className="inline-flex items-center gap-2 border-b-2 border-[#5858E2] pb-3 text-sm font-medium text-[#5858E2]"
              >
                <BookOpen className="h-4 w-4" />
                Тесты
              </Link>
            </li>
            <li>
              <Link
                href="/account/certification/works"
                className="inline-flex items-center gap-2 border-b-2 border-transparent pb-3 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <FileBadge className="h-4 w-4" />
                Работы
              </Link>
            </li>
            <li>
              <Link
                href="/account/certification/lessons"
                className="inline-flex items-center gap-2 border-b-2 border-transparent pb-3 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <FileText className="h-4 w-4" />
                Уроки
              </Link>
            </li>
            <li>
              <Link
                href="/account/certification/questionnaires"
                className="inline-flex items-center gap-2 border-b-2 border-transparent pb-3 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <ClipboardList className="h-4 w-4" />
                Вопросники
              </Link>
            </li>
          </ul>
        </nav>

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