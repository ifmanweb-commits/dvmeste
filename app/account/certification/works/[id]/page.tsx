import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Award, FileText, FileBadge, Lock, CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import WorkSubmissionClient from './WorkSubmissionClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkSubmissionPage({ params }: PageProps) {
  const { id: workId } = await params;
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  // Получаем данные работы
  const work = await prisma.challenge.findUnique({
    where: { id: workId, type: 'WORK' },
    include: {
      work: true,
    },
  });

  if (!work) {
    redirect('/account/certification/works');
  }

  // Получаем статус пользователя
  const userState = await prisma.challengeUserState.findUnique({
    where: {
      challengeId_userId: {
        challengeId: workId,
        userId: user.id,
      },
    },
  });

  // Получаем все отправки работы
  const submissions = await prisma.workSubmission.findMany({
    where: {
      challengeId: workId,
      userId: user.id,
    },
    orderBy: {
      submittedAt: 'desc',
    },
    include: {
      reviews: true,
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
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
          </ul>
        </nav>

        {/* Кнопка назад */}
        <div className="mb-6">
          <Link
            href="/account/certification/works"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад к списку работ
          </Link>
        </div>

        {/* Заголовок работы */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {work.title}
          </h1>
          {work.description && (
            <p className="mt-2 text-gray-600 whitespace-pre-wrap">
              {work.description}
            </p>
          )}
        </div>

        {/* Контент */}
        <WorkSubmissionClient
          work={work as any}
          submissions={submissions as any}
          isUnlocked={isUnlocked}
          userBalance={currentUser?.balance ?? 0}
        />
      </div>
    </div>
  );
}