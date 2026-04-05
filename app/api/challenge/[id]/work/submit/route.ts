import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/session';

// POST /api/challenge/:id/work/submit - отправить работу на проверку
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
    const { workText } = await request.json();

    // Получаем попытку
    const attempt = await prisma.challengeAttempt.findUnique({
      where: { id: attemptId },
      include: {
        challenge: {
          include: {
            work: true,
          },
        },
      },
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

    const workChallenge = attempt.challenge.work;
    if (!workChallenge) {
      return NextResponse.json(
        { error: 'Work configuration not found' },
        { status: 404 }
      );
    }

    // Сохраняем текст работы в answers.workText
    await prisma.challengeAttempt.update({
      where: { id: attemptId },
      data: {
        answers: {
          ...((attempt.answers as object) || {}),
          workText,
        },
      },
    });

    // Обновляем статус на SUBMITTED (пока нет такого статуса, используем IN_PROGRESS с флагом)
    // Для простоты оставляем IN_PROGRESS, но можно добавить статус SUBMITTED

    return NextResponse.json({
      status: 'SUBMITTED',
      message: 'Работа отправлена на проверку',
      requiredReviews: workChallenge.reviewsToPass,
    });
  } catch (error) {
    console.error('Error submitting work:', error);
    return NextResponse.json(
      { error: 'Failed to submit work' },
      { status: 500 }
    );
  }
}