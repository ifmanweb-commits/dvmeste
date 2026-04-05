import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/session';

// GET /api/challenge/:id/work/status - получить статус квалификационной работы
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: attemptId } = await params;

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

    const workChallenge = attempt.challenge.work;
    if (!workChallenge) {
      return NextResponse.json(
        { error: 'Work configuration not found' },
        { status: 404 }
      );
    }

    // Если попытка завершена - возвращаем результат
    if (attempt.status === 'COMPLETED') {
      return NextResponse.json({
        status: 'COMPLETED',
        passed: attempt.passed,
        score: attempt.score,
        requiredReviews: workChallenge.reviewsToPass,
      });
    }

    // Получаем текст работы из answers.workText
    const workText = (attempt.answers as any)?.workText || '';

    return NextResponse.json({
      status: attempt.status,
      workText,
      requiredReviews: workChallenge.reviewsToPass,
    });
  } catch (error) {
    console.error('Error getting work status:', error);
    return NextResponse.json(
      { error: 'Failed to get work status' },
      { status: 500 }
    );
  }
}