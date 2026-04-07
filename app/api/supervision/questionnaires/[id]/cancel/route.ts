import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/session';

// POST /api/supervision/questionnaires/:id/cancel - отказаться от проверки
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.isSupervisor) {
      return NextResponse.json({ error: 'Требуется роль супервизора' }, { status: 403 });
    }

    const { id: submissionId } = await params;
    const { cancelReason } = await request.json();

    // Проверяем, что работа существует и супервизор её проверяет
    const submission = await prisma.questionnaireSubmission.findUnique({
      where: { id: submissionId },
      include: {
        reviews: {
          where: {
            supervisorId: user.id,
            status: 'TAKEN',
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Работа не найдена' }, { status: 404 });
    }

    // Проверяем, что супервизор взял эту работу на проверку
    if (submission.reviews.length === 0) {
      return NextResponse.json(
        { error: 'Вы не брали эту работу на проверку' },
        { status: 400 }
      );
    }

    if (submission.status !== 'IN_REVIEW' || submission.reviewerId !== user.id) {
      return NextResponse.json(
        { error: 'Работа не находится у вас на проверке' },
        { status: 400 }
      );
    }

    // В транзакции: обновляем QuestionnaireReview и QuestionnaireSubmission
    const result = await prisma.$transaction(async (tx) => {
      // Обновляем запись о проверке - помечаем как CANCELLED
      await tx.questionnaireReview.update({
        where: {
          id: submission.reviews[0].id,
        },
        data: {
          status: 'CANCELLED',
          comment: cancelReason || null,
          resolvedAt: new Date(),
        },
      });

      // Возвращаем работу в пул
      return tx.questionnaireSubmission.update({
        where: { id: submissionId },
        data: {
          status: 'SUBMITTED',
          reviewerId: null,
        },
        include: {
          challenge: {
            include: {
              questionnaire: true,
            },
          },
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error canceling questionnaire review:', error);
    return NextResponse.json(
      { error: 'Failed to cancel questionnaire review' },
      { status: 500 }
    );
  }
}