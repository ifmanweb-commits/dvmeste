import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/session';

// PUT /api/challenge/:id/save - автосохранение ответов
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleSave(request, params);
}

// POST /api/challenge/:id/save - автосохранение ответов (альтернативный метод)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleSave(request, params);
}

async function handleSave(
  request: NextRequest,
  params: Promise<{ id: string }>
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: attemptOrSubmissionId } = await params;
    const { answers, type } = await request.json();

    // Для вопросников используем QuestionnaireSubmission
    if (type === 'QUESTIONNAIRE') {
      const submission = await prisma.questionnaireSubmission.findUnique({
        where: { id: attemptOrSubmissionId },
      });

      if (!submission) {
        return NextResponse.json(
          { error: 'Submission not found' },
          { status: 404 }
        );
      }

      if (submission.userId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Обновляем ответы в QuestionnaireSubmission
      // answers приходит как { "0": "ответ", "1": "ответ" }
      // Формат currentAnswers: [{index, text}] или [{index, text, answer}]
      const currentAnswers = submission.answers as any[] || [];
      const updatedAnswers = currentAnswers.map((a, i) => ({
        ...a,
        answer: answers?.[i.toString()] || a.answer || '',
      }));

      await prisma.questionnaireSubmission.update({
        where: { id: attemptOrSubmissionId },
        data: { answers: updatedAnswers },
      });

      return NextResponse.json({ success: true });
    }

    // Для тестов используем ChallengeAttempt
    const attempt = await prisma.challengeAttempt.findUnique({
      where: { id: attemptOrSubmissionId },
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

    // Обновляем ответы
    await prisma.challengeAttempt.update({
      where: { id: attemptOrSubmissionId },
      data: { answers },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving answers:', error);
    return NextResponse.json(
      { error: 'Failed to save answers' },
      { status: 500 }
    );
  }
}