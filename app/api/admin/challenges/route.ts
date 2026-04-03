import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/session';

// GET /api/admin/challenges - получить список всех испытаний
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (!user.isAdmin && !user.isManager)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const isActive = searchParams.get('isActive');

    const where: any = {};
    if (type) {
      where.type = type;
    }
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const challenges = await prisma.challenge.findMany({
      where,
      include: {
        test: true,
        work: true,
        _count: {
          select: {
            attempts: true,
            userStates: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(challenges);
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
      { status: 500 }
    );
  }
}

// POST /api/admin/challenges - создать испытание
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (!user.isAdmin && !user.isManager)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      slug,
      title,
      description,
      type,
      isActive = true,
      // Для теста
      questionsPool = [],
      questionsCount,
      passingScore,
      timeLimit,
      freeAttempts = 2,
      unlockPrice,
      // Для квалификационной работы
      instructions,
      requiredReviews = 1,
      reviewsToPass = 1,
      reviewPrice,
    } = body;

    // Валидация
    if (!slug || !title || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: slug, title, type' },
        { status: 400 }
      );
    }

    if (type === 'TEST') {
      if (!questionsPool || questionsPool.length === 0) {
        return NextResponse.json(
          { error: 'questionsPool is required for TEST type' },
          { status: 400 }
        );
      }
      if (!questionsCount || questionsCount < 1) {
        return NextResponse.json(
          { error: 'questionsCount must be at least 1' },
          { status: 400 }
        );
      }
      if (!passingScore || passingScore < 1) {
        return NextResponse.json(
          { error: 'passingScore must be at least 1' },
          { status: 400 }
        );
      }
      if (questionsCount > questionsPool.length) {
        return NextResponse.json(
          { error: 'questionsCount cannot be greater than questionsPool length' },
          { status: 400 }
        );
      }
      if (passingScore > questionsCount) {
        return NextResponse.json(
          { error: 'passingScore cannot be greater than questionsCount' },
          { status: 400 }
        );
      }
    }

    if (type === 'WORK') {
      if (requiredReviews < 1) {
        return NextResponse.json(
          { error: 'requiredReviews must be at least 1' },
          { status: 400 }
        );
      }
      if (reviewsToPass < 1) {
        return NextResponse.json(
          { error: 'reviewsToPass must be at least 1' },
          { status: 400 }
        );
      }
      if (reviewsToPass > requiredReviews) {
        return NextResponse.json(
          { error: 'reviewsToPass cannot be greater than requiredReviews' },
          { status: 400 }
        );
      }
    }

    // Проверка уникальности slug
    const existing = await prisma.challenge.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Challenge with this slug already exists' },
        { status: 400 }
      );
    }

    // Создаём испытание
    const challenge = await prisma.challenge.create({
      data: {
        slug,
        title,
        description,
        type,
        isActive,
        test: type === 'TEST' ? {
          create: {
            questionsPool,
            questionsCount,
            passingScore,
            timeLimit: timeLimit || null,
            freeAttempts,
            unlockPrice: unlockPrice ? unlockPrice * 100 : null, // конвертируем рубли в копейки
          },
        } : undefined,
        work: type === 'WORK' ? {
          create: {
            instructions: instructions || null,
            requiredReviews,
            reviewsToPass,
            reviewPrice: reviewPrice ? reviewPrice * 100 : null, // конвертируем рубли в копейки
          },
        } : undefined,
      },
      include: {
        test: true,
        work: true,
      },
    });

    return NextResponse.json(challenge);
  } catch (error) {
    console.error('Error creating challenge:', error);
    return NextResponse.json(
      { error: 'Failed to create challenge' },
      { status: 500 }
    );
  }
}