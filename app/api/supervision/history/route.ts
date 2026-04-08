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

    // Собираем все ID ревью для поиска транзакций
    const allReviewIds = [...workReviews.map(r => r.id), ...questionnaireReviews.map(r => r.id)];

    // Получаем транзакции для начислений
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: 'EARNING',
      },
    });

    // Фильтруем транзакции по reviewId из metadata
    const transactionMap = new Map<string, number>();
    transactions.forEach(t => {
      // Prisma хранит metadata как JsonValue, нужно корректно распарсить
      let reviewId: string | null = null;
      if (t.metadata && typeof t.metadata === 'object' && 'reviewId' in t.metadata) {
        reviewId = (t.metadata as any).reviewId as string;
      }
      if (reviewId && allReviewIds.includes(reviewId)) {
        transactionMap.set(reviewId, t.amount);
      }
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
      earning: transactionMap.get(review.id) || 0,
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
      earning: transactionMap.get(review.id) || 0,
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