import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/session';

// GET /api/supervision/history - получить историю проверок супервизора
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.isSupervisor) {
      return NextResponse.json({ error: 'Требуется роль супервизора' }, { status: 403 });
    }

    // Получаем историю проверок работ (COMPLETED и CANCELLED)
    const workReviews = await prisma.workReview.findMany({
      where: {
        supervisorId: user.id,
        status: {
          in: ['COMPLETED', 'CANCELLED'],
        },
      },
      include: {
        submission: {
          include: {
            challenge: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        resolvedAt: 'desc',
      },
    });

    // Получаем историю проверок вопросников (COMPLETED и CANCELLED)
    const questionnaireReviews = await prisma.questionnaireReview.findMany({
      where: {
        supervisorId: user.id,
        status: {
          in: ['COMPLETED', 'CANCELLED'],
        },
      },
      include: {
        submission: {
          include: {
            challenge: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        resolvedAt: 'desc',
      },
    });

    // Форматируем и объединяем результаты
    const formattedWorkReviews = workReviews.map((review) => ({
      id: review.id,
      type: 'WORK' as const,
      submissionId: review.submissionId,
      verdict: review.verdict,
      status: review.status,
      comment: review.comment,
      createdAt: review.createdAt,
      resolvedAt: review.resolvedAt,
      challenge: {
        id: review.submission.challenge.id,
        title: review.submission.challenge.title,
      },
    }));

    const formattedQuestionnaireReviews = questionnaireReviews.map((review) => ({
      id: review.id,
      type: 'QUESTIONNAIRE' as const,
      submissionId: review.submissionId,
      verdict: review.verdict,
      status: review.status,
      comment: review.comment,
      createdAt: review.createdAt,
      resolvedAt: review.resolvedAt,
      challenge: {
        id: review.submission.challenge.id,
        title: review.submission.challenge.title,
      },
    }));

    // Объединяем и сортируем по дате
    const allReviews = [...formattedWorkReviews, ...formattedQuestionnaireReviews].sort(
      (a, b) => new Date(b.resolvedAt || 0).getTime() - new Date(a.resolvedAt || 0).getTime()
    );

    return NextResponse.json(allReviews);
  } catch (error) {
    console.error('Error fetching review history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review history' },
      { status: 500 }
    );
  }
}