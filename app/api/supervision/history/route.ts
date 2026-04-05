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

    // Получаем историю проверок (COMPLETED и CANCELLED)
    const reviews = await prisma.workReview.findMany({
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
              include: {
                work: true,
              },
            },
            user: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: {
        resolvedAt: 'desc',
      },
    });

    // Форматируем результат
    const formattedReviews = reviews.map((review) => ({
      id: review.id,
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
      psychologist: {
        id: review.submission.user.id,
        fullName: review.submission.user.fullName,
      },
    }));

    return NextResponse.json(formattedReviews);
  } catch (error) {
    console.error('Error fetching review history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review history' },
      { status: 500 }
    );
  }
}