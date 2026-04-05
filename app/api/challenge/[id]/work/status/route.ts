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

    const { id: challengeId } = await params;

    // Проверяем наличие доступа (оплачено ли)
    const userState = await prisma.challengeUserState.findUnique({
      where: {
        challengeId_userId: {
          challengeId,
          userId: user.id,
        },
      },
    });

    const hasAccess = (userState?.attemptsLeft ?? 0) > 0;

    // Если нет доступа - возвращаем false
    if (!hasAccess) {
      return NextResponse.json({
        hasAccess: false,
      });
    }

    // Получаем последнюю попытку пользователя
    const attempt = await prisma.challengeAttempt.findFirst({
      where: {
        challengeId,
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      hasAccess: true,
      attempt: attempt ? {
        id: attempt.id,
        status: attempt.status,
        passed: attempt.passed,
        workText: (attempt.answers as any)?.workText,
        submittedAt: attempt.finishedAt,
      } : null,
    });
  } catch (error) {
    console.error('Error getting work status:', error);
    return NextResponse.json(
      { error: 'Failed to get work status' },
      { status: 500 }
    );
  }
}