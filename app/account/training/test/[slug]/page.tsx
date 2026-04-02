import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PracticeTestRunner from "./PracticeTestRunner";

export default async function PracticeTestPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getSession();
  
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const { slug } = await params;

  // Получаем испытание по slug
  const challenge = await prisma.challenge.findUnique({
    where: { slug },
    include: {
      test: true,
    },
  });

  if (!challenge || !challenge.test) {
    redirect("/account/training");
  }

  // Проверяем, что это тест
  if (challenge.type !== "TEST") {
    redirect("/account/training");
  }

  // Проверяем доступ пользователя через курсы
  const userCourses = await prisma.userCourse.findMany({
    where: { userId: session.user.id },
    select: { courseId: true, status: true },
  });

  if (userCourses.length === 0) {
    redirect("/account/training");
  }

  const courseIds = userCourses.map((uc) => uc.courseId);

  // Проверяем, есть ли доступ к этому тесту через какой-либо курс
  const access = await prisma.courseChallengeAccess.findFirst({
    where: {
      courseId: { in: courseIds },
      challengeId: challenge.id,
      status: {
        in: userCourses.map((uc) => uc.status),
      },
    },
  });

  if (!access) {
    redirect("/account/training");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PracticeTestRunner
        challenge={{
          id: challenge.id,
          slug: challenge.slug,
          title: challenge.title,
          description: challenge.description,
          questionsCount: challenge.test.questionsCount,
          passingScore: challenge.test.passingScore,
        }}
        userId={session.user.id}
      />
    </div>
  );
}