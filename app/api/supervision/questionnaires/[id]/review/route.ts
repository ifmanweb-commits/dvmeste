import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { creditSupervisor } from '@/lib/billing';
import { checkCertificationCompletion } from '@/lib/check-certification-completion';

// POST /api/supervision/questionnaires/:id/review - вынести вердикт
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
    const { verdict, comment } = await request.json();

    // Валидация вердикта
    if (!verdict || !['APPROVED', 'REJECTED'].includes(verdict)) {
      return NextResponse.json(
        { error: 'Неверный вердикт. Должен быть APPROVED или REJECTED' },
        { status: 400 }
      );
    }

    // Для REJECTED комментарий обязателен
    if (verdict === 'REJECTED' && (!comment || !comment.trim())) {
      return NextResponse.json(
        { error: 'При отклонении необходим комментарий' },
        { status: 400 }
      );
    }

    // Проверяем, что работа существует и супервизор её проверяет
    const submission = await prisma.questionnaireSubmission.findUnique({
      where: { id: submissionId },
      include: {
        challenge: {
          include: {
            questionnaire: true,
          },
        },
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

    if (submission.status !== 'REVIEWING' || submission.reviewerId !== user.id) {
      return NextResponse.json(
        { error: 'Работа не находится у вас на проверке' },
        { status: 400 }
      );
    }

    // Получаем настройки испытания
    const questionnaireChallenge = submission.challenge.questionnaire;
    if (!questionnaireChallenge) {
      return NextResponse.json(
        { error: 'Испытание не настроено как QUESTIONNAIRE' },
        { status: 400 }
      );
    }

    const requiredReviews = questionnaireChallenge.requiredReviews;
    const reviewsToPass = questionnaireChallenge.reviewsToPass;

    // В транзакции: обновляем QuestionnaireReview и QuestionnaireSubmission
    const result = await prisma.$transaction(async (tx) => {
      // Обновляем запись о проверке
      await tx.questionnaireReview.update({
        where: {
          id: submission.reviews[0].id,
        },
        data: {
          status: 'COMPLETED',
          verdict: verdict as 'APPROVED' | 'REJECTED',
          comment: verdict === 'REJECTED' ? comment : null,
          resolvedAt: new Date(),
        },
      });

      // Обновляем счётчики
      const updateData: {
        approvedCount?: { increment: number };
        rejectedCount?: { increment: number };
        reviewerId: null;
      } = {
        reviewerId: null,
      };

      if (verdict === 'APPROVED') {
        updateData.approvedCount = { increment: 1 };
      } else {
        updateData.rejectedCount = { increment: 1 };
      }

      const updatedSubmission = await tx.questionnaireSubmission.update({
        where: { id: submissionId },
        data: updateData,
      });

      // Проверяем порог для определения итогового статуса
      let newStatus = submission.status;
      const approvedCount = updatedSubmission.approvedCount;
      const rejectedCount = updatedSubmission.rejectedCount;

      if (approvedCount >= reviewsToPass) {
        newStatus = 'APPROVED';
      } else if (rejectedCount > (requiredReviews - reviewsToPass)) {
        newStatus = 'REJECTED';
      } else {
        newStatus = 'SUBMITTED'; // Возвращаем в пул для дальнейшей проверки
      }

      // Обновляем статус работы
      const finalSubmission = await tx.questionnaireSubmission.update({
        where: { id: submissionId },
        data: {
          status: newStatus,
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

      return finalSubmission;
    });

    // Если вопросник одобрен — проверяем сертификацию
    if (result.status === 'APPROVED') {
      await checkCertificationCompletion(result.userId, result.challengeId);
    }

    // Начисляем оплату супервизору (отдельно от транзакции)
    const price = questionnaireChallenge?.reviewPrice || 0;
    if (price > 0) {
      await creditSupervisor(user.id, price, submissionId, 'Проверка вопросника');
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error reviewing questionnaire submission:', error);
    return NextResponse.json(
      { error: 'Failed to review questionnaire submission' },
      { status: 500 }
    );
  }
}