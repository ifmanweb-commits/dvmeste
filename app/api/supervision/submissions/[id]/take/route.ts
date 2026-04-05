import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/session';

// POST /api/supervision/submissions/:id/take - взять работу на проверку
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

    // Проверяем, что работа существует и доступна для взятия
    const submission = await prisma.workSubmission.findUnique({
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
      return NextResponse.json({ error: 'Работа не найдена' }, { status: 404 });
    }

    // Проверяем, что супервизор ещё не взаимодействовал с этой работой
    if (submission.reviews.length > 0) {
      return NextResponse.json(
        { error: 'Вы уже взаимодействовали с этой работой' },
        { status: 400 }
      );
    }

    // Проверяем, что работа доступна для взятия
    if (submission.status !== 'SUBMITTED' || submission.reviewerId !== null) {
      return NextResponse.json(
        { error: 'Работа недоступна для взятия' },
        { status: 400 }
      );
    }

    // В транзакции: создаём WorkReview и обновляем WorkSubmission
    const result = await prisma.$transaction(async (tx) => {
      // Создаём запись о проверке
      await tx.workReview.create({
        data: {
          submissionId,
          supervisorId: user.id,
          status: 'TAKEN',
        },
      });

      // Обновляем работу
      return tx.workSubmission.update({
        where: { id: submissionId },
        data: {
          status: 'REVIEWING',
          reviewerId: user.id,
        },
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
              email: true,
            },
          },
        },
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error taking submission:', error);
    return NextResponse.json(
      { error: 'Failed to take submission' },
      { status: 500 }
    );
  }
}