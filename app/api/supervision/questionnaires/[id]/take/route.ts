import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/session';

// POST /api/supervision/questionnaires/:id/take - взять вопросник на проверку
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

    // Проверяем, что вопросник существует и доступен для взятия
    const submission = await prisma.questionnaireSubmission.findUnique({
      where: { id: submissionId },
      include: {
        reviews: {
          where: {
            supervisorId: user.id,
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Вопросник не найден' }, { status: 404 });
    }

    // Проверяем, что супервизор ещё не взаимодействовал с этим вопросником
    if (submission.reviews.length > 0) {
      return NextResponse.json(
        { error: 'Вы уже взаимодействовали с этим вопросником' },
        { status: 400 }
      );
    }

    // Проверяем, что вопросник доступен для взятия
    if (submission.status !== 'SUBMITTED' || submission.reviewerId !== null) {
      return NextResponse.json(
        { error: 'Вопросник недоступен для взятия' },
        { status: 400 }
      );
    }

    // В транзакции: создаём QuestionnaireReview и обновляем QuestionnaireSubmission
    const result = await prisma.$transaction(async (tx) => {
      // Создаём запись о проверке
      await tx.questionnaireReview.create({
        data: {
          submissionId,
          supervisorId: user.id,
          status: 'TAKEN',
        },
      });

      // Обновляем вопросник
      return tx.questionnaireSubmission.update({
        where: { id: submissionId },
        data: {
          status: 'IN_REVIEW' as any,
          reviewerId: user.id,
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
    console.error('Error taking questionnaire:', error);
    return NextResponse.json(
      { error: 'Failed to take questionnaire' },
      { status: 500 }
    );
  }
}