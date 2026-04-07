import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import WorksListClient from '@/components/account/WorksListClient';
import CertificationHorNav from '@/components/account/CertificationHorNav';

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
        <CertificationHorNav activeTab="works" />

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