import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Award, FileText } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import WorksListClient from '@/components/account/WorksListClient';

export default async function CertificationWorksPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  // Получаем все активные работы (Challenge type=WORK)
  const workChallenges = await prisma.challenge.findMany({
    where: {
      type: 'WORK',
      isActive: true,
    },
    include: {
      work: true,
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

  // Для каждой работы получаем статус пользователя и список сертификаций
  const worksWithStatus = await Promise.all(
    workChallenges.map(async (challenge) => {
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

      // Находим все сертификации, в которых используется эта работа
      const requirements = await prisma.certificationRequirement.findMany({
        where: { challengeId: challenge.id },
        include: {
          certification: true,
        },
      });
      const certs = requirements.map(r => r.certification);

      // Проверяем статус отправки работы
      const lastSubmission = await prisma.workSubmission.findFirst({
        where: {
          challengeId: challenge.id,
          userId: user.id,
        },
        orderBy: { submittedAt: 'desc' },
      });

      // Для WORK проверяем наличие одобренной submission
      const isCompleted = lastSubmission?.status === 'APPROVED';
      const hasInProgress = !!inProgressAttempt;
      const baseAttempts = 1; // Для работ обычно 1 попытка
      const attemptsLeft = userState?.attemptsLeft ?? baseAttempts;

      return {
        ...challenge,
        isCompleted,
        hasInProgress,
        inProgressAttemptId: inProgressAttempt?.id,
        attemptsLeft,
        workChallenge: challenge.work ? {
          instructions: challenge.work.instructions,
          requiredReviews: challenge.work.requiredReviews,
          reviewsToPass: challenge.work.reviewsToPass,
          reviewPrice: null,
        } : null,
        certifications: certs,
        submissionStatus: lastSubmission?.status || null,
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
            Работы
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
                className="inline-flex items-center gap-2 border-b-2 border-transparent pb-3 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <BookOpen className="h-4 w-4" />
                Тесты
              </Link>
            </li>
            <li>
              <Link
                href="/account/certification/works"
                className="inline-flex items-center gap-2 border-b-2 border-[#5858E2] pb-3 text-sm font-medium text-[#5858E2]"
              >
                <FileText className="h-4 w-4" />
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
          </ul>
        </nav>

        {/* Список работ */}
        <WorksListClient
          works={worksWithStatus as any}
          certifications={certifications}
          userBalance={currentUser?.balance ?? 0}
        />
      </div>
    </div>
  );
}