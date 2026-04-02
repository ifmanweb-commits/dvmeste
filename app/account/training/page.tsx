import { Suspense } from "react";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getUserCourses, activateCourseKey, getAllCoursesForSelect } from "@/lib/actions/courses";
import { prisma } from "@/lib/prisma";
import TrainingPageClient from "./TrainingPageClient";

export default async function TrainingPage() {
  const session = await getSession();
  
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const [userCourses, allCourses] = await Promise.all([
    getUserCourses(session.user.id),
    getAllCoursesForSelect(),
  ]);

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
    orderBy: { order: "asc" },
  });

  // Группируем испытания по курсам и статусам
  const challengesByCourse: Record<string, { enrolled: string[]; graduated: string[] }> = {};
  for (const access of courseAccesses) {
    if (!challengesByCourse[access.courseId]) {
      challengesByCourse[access.courseId] = { enrolled: [], graduated: [] };
    }
    challengesByCourse[access.courseId][access.status].push(access.challengeId);
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

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="mx-auto max-w-3xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <TrainingPageClient 
        userId={session.user.id}
        initialUserCourses={userCourses}
        allCourses={allCourses}
        challengesByCourse={challengesByCourse}
        challengesMap={JSON.stringify(Array.from(challengesMap.entries()))}
      />
    </Suspense>
  );
}
