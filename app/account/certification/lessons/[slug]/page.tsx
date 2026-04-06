import { getCurrentUser } from '@/lib/auth/session';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, CheckCircle, Lock } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { markLessonAsViewed, sanitizeHtml } from '@/lib/actions/lessons';

interface LessonPageProps {
  params: Promise<{ slug: string }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { slug } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Получаем урок по slug
  const lesson = await prisma.challenge.findUnique({
    where: { slug, type: 'LESSON' },
    include: {
      lesson: true,
    },
  });

  if (!lesson || !lesson.lesson) {
    notFound();
  }

  // Проверяем доступ к уроку
  const isFree = !lesson.price || lesson.price === 0;
  let isUnlocked = isFree;
  let userBalance = 0;

  if (!isFree) {
    // Проверяем, есть ли запись о просмотре
    const completion = await prisma.lessonCompletion.findUnique({
      where: {
        challengeId_userId: {
          challengeId: lesson.id,
          userId: user.id,
        },
      },
    });

    if (completion) {
      isUnlocked = true;
    } else {
      // Проверяем баланс
      const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { balance: true },
      });
      userBalance = currentUser?.balance ?? 0;
    }
  }

  // Если урок не разблокирован - показываем страницу с оплатой
  if (!isUnlocked) {
    return (
      <LockedLessonPage
        lesson={lesson}
        userBalance={userBalance}
      />
    );
  }

  // Отмечаем урок как просмотренный (при первом открытии)
  await markLessonAsViewed(lesson.id, user.id);

  // Проверяем, был ли урок уже просмотрен
  const completion = await prisma.lessonCompletion.findUnique({
    where: {
      challengeId_userId: {
        challengeId: lesson.id,
        userId: user.id,
      },
    },
  });

  const sanitizedContent = await sanitizeHtml(lesson.lesson.content);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Заголовок страницы */}
        <div className="mb-8">
          <div className="mb-4">
            <Link
              href="/account/certification/lessons"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Назад к урокам
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
              {lesson.title}
            </h1>
            {completion && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Пройдено</span>
              </div>
            )}
          </div>
          {lesson.description && (
            <p className="mt-2 text-gray-600">{lesson.description}</p>
          )}
        </div>

        {/* Навигационная панель */}
        <nav className="mb-8 border-b border-gray-200">
          <ul className="flex gap-6">
            <li>
              <Link
                href="/account/certification"
                className="inline-flex items-center gap-2 border-b-2 border-transparent pb-3 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <FileText className="h-4 w-4" />
                Сертификации
              </Link>
            </li>
            <li>
              <Link
                href="/account/certification/tests"
                className="inline-flex items-center gap-2 border-b-2 border-transparent pb-3 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <FileText className="h-4 w-4" />
                Тесты
              </Link>
            </li>
            <li>
              <Link
                href="/account/certification/works"
                className="inline-flex items-center gap-2 border-b-2 border-transparent pb-3 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <FileText className="h-4 w-4" />
                Работы
              </Link>
            </li>
            <li>
              <Link
                href="/account/certification/lessons"
                className="inline-flex items-center gap-2 border-b-2 border-[#5858E2] pb-3 text-sm font-medium text-[#5858E2]"
              >
                <FileText className="h-4 w-4" />
                Уроки
              </Link>
            </li>
          </ul>
        </nav>

        {/* Контент урока */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div
            className="prose prose-lg "
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        </div>
      </div>
    </div>
  );
}

function LockedLessonPage({
  lesson,
  userBalance,
}: {
  lesson: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    price: number | null;
  };
  userBalance: number;
}) {
  const price = lesson.price ? Math.floor(lesson.price / 100) : 0;
  const canAfford = userBalance >= price;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Заголовок страницы */}
        <div className="mb-8">
          <div className="mb-4">
            <Link
              href="/account/certification/lessons"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Назад к урокам
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Уроки
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
                <FileText className="h-4 w-4" />
                Сертификации
              </Link>
            </li>
            <li>
              <Link
                href="/account/certification/tests"
                className="inline-flex items-center gap-2 border-b-2 border-transparent pb-3 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <FileText className="h-4 w-4" />
                Тесты
              </Link>
            </li>
            <li>
              <Link
                href="/account/certification/works"
                className="inline-flex items-center gap-2 border-b-2 border-transparent pb-3 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <FileText className="h-4 w-4" />
                Работы
              </Link>
            </li>
            <li>
              <Link
                href="/account/certification/lessons"
                className="inline-flex items-center gap-2 border-b-2 border-[#5858E2] pb-3 text-sm font-medium text-[#5858E2]"
              >
                <FileText className="h-4 w-4" />
                Уроки
              </Link>
            </li>
          </ul>
        </nav>

        {/* Блокировка */}
        <div className="flex items-center justify-center">
          <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <Lock className="h-6 w-6 text-gray-600" />
            </div>

            <h2 className="mb-2 text-xl font-bold text-gray-900">
              Урок заблокирован
            </h2>

            <p className="mb-6 text-gray-600">
              {lesson.description || 'Этот урок доступен только после оплаты'}
            </p>

            <div className="mb-6 rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Стоимость урока</p>
              <p className="text-2xl font-bold text-gray-900">{price} ₽</p>
              <p className="mt-2 text-sm text-gray-500">
                Ваш баланс: {userBalance} ₽
              </p>
            </div>

            {canAfford ? (
              <button
                className="w-full rounded-lg bg-[#5858E2] py-3 text-sm font-medium text-white hover:bg-[#4a4ac4]"
                onClick={() => {
                  // TODO: реализовать оплату
                }}
              >
                Оплатить и разблокировать
              </button>
            ) : (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                Недостаточно средств на балансе
              </div>
            )}

            <Link
              href="/account/certification/lessons"
              className="mt-4 block text-sm text-gray-600 hover:text-gray-900"
            >
              Вернуться к списку уроков
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}