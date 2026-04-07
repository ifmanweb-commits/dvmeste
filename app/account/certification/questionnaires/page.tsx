import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import QuestionnairesListClient from '@/components/account/QuestionnairesListClient';
import CertificationHorNav from '@/components/account/CertificationHorNav';

export default async function CertificationQuestionnairesPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  // Получаем все активные вопросники (Challenge type=QUESTIONNAIRE)
  const questionnaireChallenges = await prisma.challenge.findMany({
    where: {
      type: 'QUESTIONNAIRE',
      isActive: true,
    },
    include: {
      questionnaire: true,
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

  // Получаем баланс пользователя
  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { balance: true },
  });

  // Для каждого вопросника получаем статус пользователя и список сертификаций
  const questionnairesWithStatus = await Promise.all(
    questionnaireChallenges.map(async (challenge) => {
      // Последняя submission (вопросник отправлен на проверку)
      const lastSubmission = await prisma.questionnaireSubmission.findFirst({
        where: {
          userId: user.id,
          challengeId: challenge.id,
        },
        orderBy: { submittedAt: 'desc' },
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

      // Находим все сертификации, в которых используется этот вопросник
      const requirements = await prisma.certificationRequirement.findMany({
        where: { challengeId: challenge.id },
        include: {
          certification: true,
        },
      });
      const certs = requirements.map(r => r.certification);

      // isCompleted = true только если submission одобрен
      const isCompleted = lastSubmission?.status === 'APPROVED';
      const hasInProgress = !!inProgressAttempt;
      const submissionStatus = lastSubmission?.status ?? null;
      const baseAttempts = 1; // у вопросников нет freeAttempts в модели
      const attemptsLeft = userState?.attemptsLeft ?? baseAttempts;

      return {
        ...challenge,
        isCompleted,
        hasInProgress,
        inProgressAttemptId: inProgressAttempt?.id,
        submissionStatus,
        attemptsLeft,
        questionnaire: challenge.questionnaire ? {
          questionsCount: challenge.questionnaire.questionsCount || (challenge.questionnaire.questionsPool as string[])?.length || 0,
          timeLimit: challenge.questionnaire.timeLimit,
          reviewPrice: challenge.questionnaire.reviewPrice,
        } : null,
        certifications: certs,
      };
    })
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Заголовок страницы */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Вопросники
          </h1>
        </div>

        {/* Навигационная панель */}
        <CertificationHorNav activeTab="questionnaires" />

        {/* Список вопросников */}
        <QuestionnairesListClient
          questionnaires={questionnairesWithStatus as any}
          certifications={certifications}
          userBalance={currentUser?.balance ?? 0}
        />
      </div>
    </div>
  );
}