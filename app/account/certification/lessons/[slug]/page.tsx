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

        {/* Заголовок урока и кнопка назад */}
        <div className="mb-8">

          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {lesson.title}
            </h2>
            {completion && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Пройдено</span>
              </div>
            )}
          </div>
        </div>

        {/* Контент урока */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div
            className="prose prose-lg max-w-none
              prose-headings:font-bold prose-headings:text-gray-900
              prose-h1:text-3xl prose-h1:mb-4
              prose-h2:text-2xl prose-h2:mb-3 prose-h2:mt-6
              prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-4
              prose-h4:text-lg prose-h4:mb-2
              prose-p:text-gray-700 prose-p:mb-4 prose-p:leading-relaxed
              prose-ul:mb-4 prose-ul:list-disc prose-ul:pl-6
              prose-ol:mb-4 prose-ol:list-decimal prose-ol:pl-6
              prose-li:mb-1 prose-li:text-gray-700
              prose-a:text-[#5858E2] prose-a:underline prose-a:hover:text-[#4a4ac4]
              prose-blockquote:border-l-4 prose-blockquote:border-[#5858E2] prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600
              prose-code:rounded prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:font-mono
              prose-pre:rounded-lg prose-pre:bg-gray-900 prose-pre:p-4
              prose-img:rounded-lg prose-img:my-4
              prose-hr:my-6 prose-hr:border-gray-200
              prose-strong:font-semibold prose-strong:text-gray-900
              prose-em:italic prose-em:text-gray-600"
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