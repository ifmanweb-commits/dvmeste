import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ClipboardList, Award, FileText, FileBadge, BookOpen, CheckCircle } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import QuestionnairesListClient from '@/components/account/QuestionnairesListClient';

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

  // Для каждого вопросника получаем статус пользователя и список сертификаций
  const questionnairesWithStatus = await Promise.all(
    questionnaireChallenges.map(async (challenge) => {
      // Проверяем, есть ли submission (вопросник отправлен на проверку)
      const existingSubmission = await prisma.questionnaireSubmission.findFirst({
        where: {
          userId: user.id,
          challengeId: challenge.id,
        },
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

      // Находим все сертификации, в которых используется этот вопросник
      const requirements = await prisma.certificationRequirement.findMany({
        where: { challengeId: challenge.id },
        include: {
          certification: true,
        },
      });
      const certs = requirements.map(r => r.certification);

      const isCompleted = !!existingSubmission;
      const hasInProgress = !!inProgressAttempt;
      const submissionStatus = existingSubmission?.status;

      return {
        ...challenge,
        isCompleted,
        hasInProgress,
        inProgressAttemptId: inProgressAttempt?.id,
        submissionStatus,
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
                className="inline-flex items-center gap-2 border-b-2 border-[#5858E2] pb-3 text-sm font-medium text-[#5858E2]"
              >
                <ClipboardList className="h-4 w-4" />
                Вопросники
              </Link>
            </li>
          </ul>
        </nav>

        {/* Список вопросников */}
        <QuestionnairesListClient
          questionnaires={questionnairesWithStatus as any}
          certifications={certifications}
        />
      </div>
    </div>
  );
}