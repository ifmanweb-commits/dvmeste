import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/session';

// GET /api/challenge/:id/status - получить текущее состояние попытки
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

    // Получаем попытку с данными теста/вопросника
    const attempt = await prisma.challengeAttempt.findUnique({
      where: { id: attemptId },
      include: {
        challenge: {
          include: {
            test: true,
            questionnaire: true,
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

    const testChallenge = attempt.challenge.test;
    const questionnaireChallenge = attempt.challenge.questionnaire;
    
    // Определяем тип испытания
    const isQuestionnaire = attempt.challenge.type === 'QUESTIONNAIRE';
    
    if (!testChallenge && !questionnaireChallenge) {
      return NextResponse.json(
        { error: 'Challenge configuration not found' },
        { status: 404 }
      );
    }

    // Если попытка завершена - возвращаем результат
    if (attempt.status === 'COMPLETED') {
      if (isQuestionnaire) {
        return NextResponse.json({
          status: 'COMPLETED',
          submissionStatus: 'SUBMITTED',
        });
      }
      return NextResponse.json({
        status: 'COMPLETED',
        passed: attempt.passed,
        score: attempt.score,
        passingScore: testChallenge?.passingScore,
        totalQuestions: testChallenge?.questionsCount,
        timeExpired: false,
      });
    }

    // Получаем вопросы (без правильных ответов)
    const selectedQuestions = (attempt.selectedQuestionIndices as any[]) || [];
    
    let questions: any[];
    let timeLimit: number | null = null;
    
    if (isQuestionnaire && questionnaireChallenge) {
      // Для вопросника - только текст вопросов
      questions = selectedQuestions.map((q, i) => ({
        index: i,
        text: q.text,
      }));
      timeLimit = questionnaireChallenge.timeLimit;
    } else if (testChallenge) {
      // Для теста - с вариантами ответов
      questions = selectedQuestions.map((q, i) => ({
        index: i,
        text: q.text,
        type: q.type,
        options: q.options,
      }));
      timeLimit = testChallenge.timeLimit;
    } else {
      return NextResponse.json(
        { error: 'Challenge configuration not found' },
        { status: 404 }
      );
    }

    // Считаем оставшееся время (если есть лимит)
    let timeRemaining: number | null = null;
    if (timeLimit && attempt.startedAt) {
      const startTime = attempt.startedAt.getTime();
      const endTime = startTime + timeLimit * 60 * 1000;
      const now = Date.now();
      timeRemaining = Math.max(0, Math.floor((endTime - now) / 1000));
    }

    return NextResponse.json({
      status: attempt.status,
      challengeTitle: attempt.challenge.title,
      questions,
      questionsCount: selectedQuestions.length,
      answers: attempt.answers || {},
      timeRemaining,
      timeLimit,
      instructionsForPsychologist: questionnaireChallenge?.instructionsForPsychologist || null,
    });
  } catch (error) {
    console.error('Error getting attempt status:', error);
    return NextResponse.json(
      { error: 'Failed to get attempt status' },
      { status: 500 }
    );
  }
}