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
    const { slug } = body;

    if (!slug) {
      return NextResponse.json(
        { error: 'Challenge slug is required' },
        { status: 400 }
      );
    }

    // Получаем испытание
    const challenge = await prisma.challenge.findUnique({
      where: { slug },
      include: {
        test: true,
      },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    if (challenge.type !== 'TEST') {
      return NextResponse.json(
        { error: 'Challenge is not a test' },
        { status: 400 }
      );
    }

    const testChallenge = challenge.test;
    if (!testChallenge) {
      return NextResponse.json(
        { error: 'Test configuration not found' },
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
          attemptsLeft: testChallenge.freeAttempts,
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

    // Выбираем случайные вопросы из пула
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

    // Создаём новую попытку
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
  } catch (error) {
    console.error('Error starting challenge:', error);
    return NextResponse.json(
      { error: 'Failed to start challenge' },
      { status: 500 }
    );
  }
}