import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/training/test/[slug]/start
 * 
 * Получение вопросов для учебного теста.
 * Проверяет доступ пользователя к тесту через курс.
 * Возвращает выбранные вопросы (без правильных ответов).
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

    // Выбираем случайные вопросы
    const questionsCount = challenge.test.questionsCount;
    const shuffledIndices = Array.from({ length: questionsPool.length }, (_, i) => i);
    
    // Перемешиваем индексы
    for (let i = shuffledIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
    }

    const selectedIndices = shuffledIndices.slice(0, questionsCount);

    // Формируем вопросы для клиента (без correct!)
    const questions = selectedIndices.map((index, questionIndex) => {
      const q = questionsPool[index];
      return {
        questionIndex,
        originalIndex: index,
        text: q.text,
        type: q.type,
        options: q.options,
      };
    });

    return NextResponse.json({
      challengeId: challenge.id,
      challengeSlug: challenge.slug,
      challengeTitle: challenge.title,
      questionsCount: questions.length,
      questions,
    });
  } catch (error) {
    console.error("Ошибка при получении вопросов для учебного теста:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}