import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/training/test/[slug]/pool
 * 
 * Получение полного пула вопросов с правильными ответами.
 * Используется для проверки ответов на клиенте.
 * Проверяет доступ пользователя к тесту через курс.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
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
      return NextResponse.json({ error: "Тест не найден" }, { status: 404 });
    }

    // Проверяем, что это тест
    if (challenge.type !== "TEST") {
      return NextResponse.json({ error: "Это не тест" }, { status: 400 });
    }

    // Проверяем доступ пользователя через курсы
    const userCourses = await prisma.userCourse.findMany({
      where: { userId: session.user.id },
      select: { courseId: true, status: true },
    });

    if (userCourses.length === 0) {
      return NextResponse.json({ error: "Нет доступа к тесту" }, { status: 403 });
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
      return NextResponse.json({ error: "Нет доступа к этому тесту" }, { status: 403 });
    }

    // Получаем пул вопросов
    const questionsPool = challenge.test.questionsPool as Array<{
      text: string;
      type: string;
      options: string[];
      correct: number[];
      explanation?: string;
    }>;

    // Добавляем originalIndex к каждому вопросу
    const questionsPoolWithIndex = questionsPool.map((q, index) => ({
      originalIndex: index,
      ...q,
    }));

    return NextResponse.json({
      challengeId: challenge.id,
      questionsPool: questionsPoolWithIndex,
    });
  } catch (error) {
    console.error("Ошибка при получении пула вопросов:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}