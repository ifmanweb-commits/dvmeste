import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import QuestionnaireDetailClient from './QuestionnaireDetailClient';
import CertificationHorNav from '@/components/account/CertificationHorNav';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function QuestionnaireDetailPage({ params }: PageProps) {
  const { id: questionnaireId } = await params;
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  // Получаем данные вопросника
  const questionnaire = await prisma.challenge.findUnique({
    where: { id: questionnaireId, type: 'QUESTIONNAIRE' },
    include: {
      questionnaire: true,
    },
  });

  if (!questionnaire) {
    redirect('/account/certification/questionnaires');
  }

  // Получаем статус пользователя (остаток попыток)
  const userState = await prisma.challengeUserState.findUnique({
    where: {
      challengeId_userId: {
        challengeId: questionnaireId,
        userId: user.id,
      },
    },
  });

  // Получаем все отправки вопросника
  const submissions = await prisma.questionnaireSubmission.findMany({
    where: {
      challengeId: questionnaireId,
      userId: user.id,
    },
    orderBy: {
      submittedAt: 'desc',
    },
  });

  // Получаем баланс пользователя
  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { balance: true },
  });

  // Определяем статусы
  const attemptsLeft = userState?.attemptsLeft ?? 1;
  const isUnlocked = attemptsLeft > 0;

  // Проверяем, есть ли активная попытка (IN_PROGRESS)
  const inProgressAttempt = await prisma.challengeAttempt.findFirst({
    where: {
      challengeId: questionnaireId,
      userId: user.id,
      status: 'IN_PROGRESS',
    },
    orderBy: { createdAt: 'desc' },
  });

  // Проверяем, есть ли submission на проверке (любое, кроме null)
  const pendingSubmission = submissions.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Навигационная панель */}
        <CertificationHorNav activeTab="questionnaires" />

        {/* Кнопка назад */}
        <div className="mb-6">
          <Link
            href="/account/certification/questionnaires"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад к списку вопросников
          </Link>
        </div>

        {/* Заголовок вопросника */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {questionnaire.title}
          </h1>
          {questionnaire.description && (
            <p className="mt-2 text-gray-600 whitespace-pre-wrap">
              {questionnaire.description}
            </p>
          )}
        </div>

        {/* Контент */}
        <QuestionnaireDetailClient
          questionnaire={questionnaire as any}
          submissions={submissions as any}
          isUnlocked={isUnlocked}
          hasInProgress={!!inProgressAttempt}
          inProgressAttemptId={inProgressAttempt?.id || null}
          pendingSubmission={!!pendingSubmission}
          userBalance={currentUser?.balance ?? 0}
        />
      </div>
    </div>
  );
}