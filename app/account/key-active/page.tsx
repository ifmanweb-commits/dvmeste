import { Suspense } from 'react';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getUserCourses, getAllCoursesForSelect } from '@/lib/actions/courses';
import KeyActivePageClient from './KeyActivePageClient';

export default async function KeyActivePage() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const userId = session.user.id;

  // Получаем данные параллельно
  const [userCoursesResult, allCourses, userAccesses, secretPages] = await Promise.all([
    getUserCourses(userId),
    getAllCoursesForSelect(),
    // Получаем все доступы пользователя
    prisma.userAccess.findMany({
      where: { userId },
      orderBy: { grantedAt: 'desc' },
    }),
    // Получаем все секретные страницы
    prisma.secretPage.findMany({
      select: { id: true, title: true, slug: true },
    }),
  ]);

  // Преобразуем userCourses в нужный формат
  const userCourses = userCoursesResult.map((uc) => ({
    courseId: uc.courseId,
    status: uc.status as 'enrolled' | 'graduated',
    course: uc.course,
  }));

  // Получаем все связи курсов с испытаниями
  const courseAccesses = await prisma.courseChallengeAccess.findMany({
    where: {
      courseId: {
        in: userCourses.map((uc) => uc.courseId),
      },
    },
    include: {
      challenge: {
        include: {
          test: true,
        },
      },
    },
    orderBy: { order: 'asc' },
  });

  // Группируем испытания по курсам и статусам
  const challengesByCourse: Record<string, { enrolled: string[]; graduated: string[] }> = {};
  for (const access of courseAccesses) {
    if (!challengesByCourse[access.courseId]) {
      challengesByCourse[access.courseId] = { enrolled: [], graduated: [] };
    }
    const status = access.status as 'enrolled' | 'graduated';
    challengesByCourse[access.courseId][status].push(access.challengeId);
  }

  // Получаем данные о тестах
  const allChallengeIds = courseAccesses.map((a) => a.challengeId);
  const challenges = await prisma.challenge.findMany({
    where: { id: { in: allChallengeIds } },
    include: {
      test: true,
    },
  });

  // Создаём мапу challengeId -> challenge
  const challengesMap = new Map(challenges.map((c) => [c.id, c]));

  // Фильтруем секретные страницы, к которым есть доступ
  const accessibleSecretPages = secretPages.filter((page) =>
    userAccesses.some((access) => access.resourceType === 'page' && access.resourceId === page.id)
  );

  // Проверяем доступ к секретному каталогу
  const hasSecretCatalogAccess = userAccesses.some(
    (access) => access.resourceType === 'catalog' && access.resourceId === 'secret-catalog'
  );

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 p-4 md:p-6"><div className="animate-pulse h-8 bg-gray-200 rounded w-1/3 mb-4"></div><div className="animate-pulse h-64 bg-gray-200 rounded"></div></div>}>
      <KeyActivePageClient
        userId={userId}
        initialUserCourses={userCourses}
        allCourses={allCourses}
        challengesByCourse={challengesByCourse}
        challengesMap={JSON.stringify(Array.from(challengesMap.entries()))}
        accessibleSecretPages={accessibleSecretPages}
        hasSecretCatalogAccess={hasSecretCatalogAccess}
      />
    </Suspense>
  );
}
