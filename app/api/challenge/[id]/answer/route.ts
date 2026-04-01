import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/session';

// POST /api/challenge/:id/answer - сохранить ответ на вопрос
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: attemptId } = await params;
    const body = await request.json();
    const { questionIndex, answers } = body;

    if (typeof questionIndex !== 'number' || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Получаем попытку
    const attempt = await prisma.challengeAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      );
    }

    if (attempt.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (attempt.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Attempt is not in progress' },
        { status: 400 }
      );
    }

    // Получаем текущие ответы
    const currentAnswers = (attempt.answers as Record<string, number[]>) || {};

    // Обновляем ответ для конкретного вопроса
    currentAnswers[questionIndex.toString()] = answers;

    // Сохраняем обновлённые ответы
    await prisma.challengeAttempt.update({
      where: { id: attemptId },
      data: { answers: currentAnswers },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving answer:', error);
    return NextResponse.json(
      { error: 'Failed to save answer' },
      { status: 500 }
    );
  }
}