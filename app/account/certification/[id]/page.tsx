import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import CertificationProgramClient from '@/components/account/CertificationProgramClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CertificationProgramPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  // Получаем сертификацию по id
  const certification = await prisma.certification.findUnique({
    where: { id, isActive: true },
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

  // Получаем баланс пользователя
  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { balance: true },
  });

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

      // Проверяем, есть ли работа на проверке (для WORK испытаний)
      const workSubmission = await prisma.workSubmission.findFirst({
        where: {
          challengeId: req.challengeId,
          userId: user.id,
          status: {
            in: ['SUBMITTED', 'REVIEWING'],
          },
        },
        select: {
          status: true,
        },
      });

      const isCompleted = !!successfulAttempt;
      const hasInProgress = !!inProgressAttempt;
      const workStatus = workSubmission?.status as 'SUBMITTED' | 'REVIEWING' | null;
      
      // Для тестов берем freeAttempts, для работ - всегда 0 (платная разблокировка)
      const baseAttempts = req.challenge.type === 'TEST' 
        ? (req.challenge.test?.freeAttempts || 0) 
        : 0;
      const attemptsLeft = userState?.attemptsLeft ?? baseAttempts;

      return {
        ...req,
        isCompleted,
        hasInProgress,
        inProgressAttemptId: inProgressAttempt?.id,
        attemptsLeft,
        workStatus,
        challenge: {
          ...req.challenge,
          price: (req.challenge as any).price as number | null,
          test: req.challenge.test ? {
            questionsCount: req.challenge.test.questionsCount,
            passingScore: req.challenge.test.passingScore,
          } : null,
        },
      };
    })
  );

  // Проверяем, все ли требования выполнены
  const allCompleted = requirementsWithStatus.every((req) => req.isCompleted);

  return (
    <CertificationProgramClient
      certification={{
        id: certification.id,
        slug: certification.slug,
        title: certification.title,
        description: certification.description,
        awards: certification.awards.map(a => ({ awardedAt: a.awardedAt.toISOString() })),
      }}
      requirementsWithStatus={requirementsWithStatus as any}
      allCompleted={allCompleted}
      isCertified={isCertified}
      userBalance={currentUser?.balance ?? 0}
    />
  );
}