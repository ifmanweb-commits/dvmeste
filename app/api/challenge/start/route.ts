import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/session';

// POST /api/challenge/start - начать новую попытку прохождения теста
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { challengeId, slug } = body;

    if (!challengeId && !slug) {
      return NextResponse.json(
        { error: 'Challenge id or slug is required' },
        { status: 400 }
      );
    }

    // Получаем испытание
    const challenge = await prisma.challenge.findUnique({
      where: challengeId ? { id: challengeId } : { slug },
      include: {
        test: true,
        questionnaire: true,
      },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    if (challenge.type !== 'TEST' && challenge.type !== 'QUESTIONNAIRE') {
      return NextResponse.json(
        { error: 'Challenge type not supported' },
        { status: 400 }
      );
    }

    // Для тестов
    const testChallenge = challenge.test;
    // Для вопросников
    const questionnaireChallenge = challenge.questionnaire;
    
    if (challenge.type === 'TEST' && !testChallenge) {
      return NextResponse.json(
        { error: 'Test configuration not found' },
        { status: 404 }
      );
    }
    
    if (challenge.type === 'QUESTIONNAIRE' && !questionnaireChallenge) {
      return NextResponse.json(
        { error: 'Questionnaire configuration not found' },
        { status: 404 }
      );
    }

    // Проверяем, есть ли незавершённая попытка
    const existingAttempt = await prisma.challengeAttempt.findFirst({
      where: {
        userId: user.id,
        challengeId: challenge.id,
        status: 'IN_PROGRESS',
      },
    });

    if (existingAttempt) {
      return NextResponse.json({
        attemptId: existingAttempt.id,
        exists: true,
      });
    }

    // Получаем или создаём состояние пользователя
    let userState = await prisma.challengeUserState.findUnique({
      where: {
        challengeId_userId: {
          challengeId: challenge.id,
          userId: user.id,
        },
      },
    });

    if (!userState) {
      userState = await prisma.challengeUserState.create({
        data: {
          challengeId: challenge.id,
          userId: user.id,
          attemptsLeft: challenge.type === 'TEST' ? (testChallenge?.freeAttempts || 2) : 1,
        },
      });
    }

    // Проверяем, есть ли доступные попытки
    if (userState.attemptsLeft <= 0) {
      return NextResponse.json(
        { error: 'No attempts left. Please purchase more.' },
        { status: 403 }
      );
    }

    if (challenge.type === 'TEST' && testChallenge) {
      // Выбираем случайные вопросы из пула для теста
      const questionsPool = testChallenge.questionsPool as any[];
      const questionsCount = testChallenge.questionsCount;
      
      // Создаём массив индексов и перемешиваем
      const indices = Array.from({ length: questionsPool.length }, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      
      // Берём первые questionsCount индексов
      const selectedIndices = indices.slice(0, questionsCount);
      
      // Создаём массив вопросов с правильными ответами для хранения в попытке
      const selectedQuestions = selectedIndices.map((poolIndex) => {
        const q = questionsPool[poolIndex];
        return {
          poolIndex,
          text: q.text,
          type: q.type,
          options: q.options,
          correct: q.correct,
          explanation: q.explanation || '',
        };
      });

      // Создаём новую попытку для теста
      const attempt = await prisma.challengeAttempt.create({
        data: {
          challengeId: challenge.id,
          userId: user.id,
          status: 'IN_PROGRESS',
          startedAt: new Date(),
          selectedQuestionIndices: selectedQuestions,
          answers: {},
        },
      });

      return NextResponse.json({
        attemptId: attempt.id,
        exists: false,
        questionsCount,
        timeLimit: testChallenge.timeLimit,
      });
    } else if (challenge.type === 'QUESTIONNAIRE' && questionnaireChallenge) {
      // Для вопросников - используем QuestionnaireSubmission, а не ChallengeAttempt
      const questionsPool = questionnaireChallenge.questionsPool as string[];
      const questionsCount = questionnaireChallenge.questionsCount;
      
      // Проверяем, есть ли уже активная попытка (QuestionnaireSubmission)
      // Активная попытка - это submission со статусом IN_PROGRESS (в процессе заполнения)
      const existingSubmission = await prisma.questionnaireSubmission.findFirst({
        where: {
          userId: user.id,
          challengeId: challenge.id,
          status: 'IN_PROGRESS',
        },
        orderBy: { startedAt: 'desc' },
      });

      if (existingSubmission) {
        return NextResponse.json({
          submissionId: existingSubmission.id,
          exists: true,
        });
      }
      
      // Получаем или создаём состояние пользователя для проверки attemptsLeft
      let userState = await prisma.challengeUserState.findUnique({
        where: {
          challengeId_userId: {
            challengeId: challenge.id,
            userId: user.id,
          },
        },
      });

      // Если состояния нет, создаём с 1 попыткой (бесплатная первая попытка)
      if (!userState) {
        userState = await prisma.challengeUserState.create({
          data: {
            challengeId: challenge.id,
            userId: user.id,
            attemptsLeft: 1,
          },
        });
      }

      // Проверяем, есть ли доступные попытки
      if (userState.attemptsLeft <= 0) {
        return NextResponse.json(
          { error: 'No attempts left. Please purchase more.' },
          { status: 403 }
        );
      }

      // Выбираем случайно questionsCount вопросов из пула
      const shuffled = [...questionsPool].sort(() => Math.random() - 0.5);
      const selectedQuestions = shuffled.slice(0, questionsCount).map((text, index) => ({
        index,
        text,
      }));

      // Уменьшаем количество попыток
      await prisma.challengeUserState.update({
        where: { id: userState.id },
        data: { attemptsLeft: userState.attemptsLeft - 1 },
      });

      // Создаём QuestionnaireSubmission с вопросами (answers будет пустым)
      const submission = await prisma.questionnaireSubmission.create({
        data: {
          challengeId: challenge.id,
          userId: user.id,
          answers: selectedQuestions, // Сохраняем список вопросов в answers
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        },
      });

      return NextResponse.json({
        submissionId: submission.id,
        exists: false,
        questionsCount,
        timeLimit: questionnaireChallenge.timeLimit,
      });
    }
    
    return NextResponse.json(
      { error: 'Challenge configuration not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error starting challenge:', error);
    return NextResponse.json(
      { error: 'Failed to start challenge' },
      { status: 500 }
    );
  }
}