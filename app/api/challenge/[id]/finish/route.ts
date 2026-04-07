import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { checkCertificationCompletion } from '@/lib/check-certification-completion';

// POST /api/challenge/:id/finish - завершить тест и получить результат
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: attemptOrSubmissionId } = await params;
    const { type } = await request.json().catch(() => ({}));

    // Для вопросников используем QuestionnaireSubmission
    if (type === 'QUESTIONNAIRE') {
      const submission = await prisma.questionnaireSubmission.findUnique({
        where: { id: attemptOrSubmissionId },
        include: {
          challenge: {
            include: {
              questionnaire: true,
            },
          },
        },
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

      const questionnaireChallenge = submission.challenge.questionnaire;
      
      // Проверяем время (если есть лимит)
      if (questionnaireChallenge?.timeLimit && submission.startedAt) {
        const startTime = submission.startedAt.getTime();
        const endTime = startTime + questionnaireChallenge.timeLimit * 60 * 1000;
        const now = Date.now();
        
        if (now > endTime) {
          // Время истекло - отклоняем вопросник
          await prisma.questionnaireSubmission.update({
            where: { id: attemptOrSubmissionId },
            data: {
              status: 'REJECTED',
              submittedAt: new Date(),
            },
          });
          
          // Уменьшаем количество попыток
          await prisma.challengeUserState.update({
            where: {
              challengeId_userId: {
                challengeId: submission.challengeId,
                userId: submission.userId,
              },
            },
            data: { attemptsLeft: { decrement: 1 } },
          });
          
          return NextResponse.json({
            status: 'COMPLETED',
            passed: false,
            timeExpired: true,
          });
        }
      }
      
      // Обновляем статус на SUBMITTED (отправлено на проверку)
      // attemptsLeft уже был уменьшен при старте в start/route.ts
      // REVIEWING будет установлен когда супервизор возьмёт вопросник через API take
      await prisma.questionnaireSubmission.update({
        where: { id: attemptOrSubmissionId },
        data: {
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
      });
      
      return NextResponse.json({
        status: 'COMPLETED',
        submissionId: submission.id,
      });
    }

    // Для тестов используем ChallengeAttempt
    const attempt = await prisma.challengeAttempt.findUnique({
      where: { id: attemptOrSubmissionId },
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

    if (attempt.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Attempt is not in progress' },
        { status: 400 }
      );
    }

    const testChallenge = attempt.challenge.test;
    const questionnaireChallenge = attempt.challenge.questionnaire;
    const isQuestionnaire = attempt.challenge.type === 'QUESTIONNAIRE';
    
    if (!testChallenge && !questionnaireChallenge) {
      return NextResponse.json(
        { error: 'Challenge configuration not found' },
        { status: 404 }
      );
    }

    // Для вопросника - отдельная логика (оставляем для обратной совместимости)
    if (isQuestionnaire && questionnaireChallenge) {
      const body = await request.json();
      const { answers } = body || {};
      
      // Проверяем время (если есть лимит)
      if (questionnaireChallenge.timeLimit && attempt.startedAt) {
        const startTime = attempt.startedAt.getTime();
        const endTime = startTime + questionnaireChallenge.timeLimit * 60 * 1000;
        const now = Date.now();
        
        if (now > endTime) {
          // Время истекло
          await prisma.challengeAttempt.update({
            where: { id: attemptOrSubmissionId },
            data: {
              status: 'COMPLETED',
              finishedAt: new Date(),
            },
          });
          
          return NextResponse.json({
            status: 'COMPLETED',
            timeExpired: true,
          });
        }
      }
      
      // Создаём submission для вопросника
      const selectedQuestions = (attempt.selectedQuestionIndices as any[]) || [];
      const formattedAnswers = selectedQuestions.map((q, i) => ({
        questionIndex: i,
        answer: answers?.[i.toString()] || '',
      }));
      
      const submission = await prisma.questionnaireSubmission.create({
        data: {
          challengeId: attempt.challengeId,
          userId: user.id,
          answers: formattedAnswers,
          status: 'SUBMITTED',
          startedAt: attempt.startedAt || new Date(),
          submittedAt: new Date(),
        },
      });
      
      // Обновляем попытку
      await prisma.challengeAttempt.update({
        where: { id: attemptOrSubmissionId },
        data: {
          status: 'COMPLETED',
          finishedAt: new Date(),
          answers: answers || {},
        },
      });
      
      // Уменьшаем количество попыток
      await prisma.challengeUserState.update({
        where: {
          challengeId_userId: {
            challengeId: attempt.challengeId,
            userId: user.id,
          },
        },
        data: { attemptsLeft: { decrement: 1 } },
      });
      
      return NextResponse.json({
        status: 'COMPLETED',
        submissionId: submission.id,
      });
    }

    // Проверяем время (если есть лимит)
    if (testChallenge && testChallenge.timeLimit && attempt.startedAt) {
      const startTime = attempt.startedAt.getTime();
      const endTime = startTime + testChallenge.timeLimit * 60 * 1000;
      const now = Date.now();
      
      if (now > endTime) {
        // Время истекло - автоматический провал
        await prisma.challengeAttempt.update({
          where: { id: attemptOrSubmissionId },
          data: {
            status: 'COMPLETED',
            passed: false,
            finishedAt: new Date(),
            score: 0,
          },
        });

        // Уменьшаем количество попыток
        await prisma.challengeUserState.update({
          where: {
            challengeId_userId: {
              challengeId: attempt.challengeId,
              userId: user.id,
            },
          },
          data: { attemptsLeft: { decrement: 1 } },
        });

        return NextResponse.json({
          status: 'COMPLETED',
          passed: false,
          score: 0,
          timeExpired: true,
        });
      }
    }

    // Получаем ответы пользователя и правильные ответы
    // selectedQuestionIndices теперь содержит полные объекты вопросов
    const selectedQuestions = (attempt.selectedQuestionIndices as any[]) || [];
    const userAnswers = (attempt.answers as Record<string, number[]>) || {};

    // Считаем правильные ответы
    let correctCount = 0;

    for (let i = 0; i < selectedQuestions.length; i++) {
      const question = selectedQuestions[i];
      const userAnswer = userAnswers[i.toString()] || [];
      const correctAnswers = question.correct || [];

      // Сортируем для сравнения
      const sortedUser = [...userAnswer].sort((a, b) => a - b);
      const sortedCorrect = [...correctAnswers].sort((a, b) => a - b);

      // Проверяем, совпадают ли ответы
      if (
        sortedUser.length === sortedCorrect.length &&
        sortedUser.every((val, idx) => val === sortedCorrect[idx])
      ) {
        correctCount++;
      }
    }

    const score = correctCount;
    const passingScore = testChallenge?.passingScore || 0;
    const passed = score >= passingScore;

    // Обновляем попытку
    await prisma.challengeAttempt.update({
      where: { id: attemptOrSubmissionId },
      data: {
        status: 'COMPLETED',
        passed,
        finishedAt: new Date(),
        score,
      },
    });

    // Если не сдал - уменьшаем количество попыток
    if (!passed) {
      await prisma.challengeUserState.update({
        where: {
          challengeId_userId: {
            challengeId: attempt.challengeId,
            userId: user.id,
          },
        },
        data: { attemptsLeft: { decrement: 1 } },
      });
    }

    // Если сдал - проверяем сертификацию
    if (passed) {
      await checkCertificationCompletion(user.id, attempt.challengeId);
    }

    return NextResponse.json({
      status: 'COMPLETED',
      passed,
      score,
      passingScore,
      totalQuestions: selectedQuestions.length,
      timeExpired: false,
    });
  } catch (error) {
    console.error('Error finishing challenge:', error);
    return NextResponse.json(
      { error: 'Failed to finish challenge' },
      { status: 500 }
    );
  }
}