import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/session';

// GET /api/admin/challenges/[id] - получить испытание по ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (!user.isAdmin && !user.isManager)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const challenge = await prisma.challenge.findUnique({
      where: { id },
      include: {
        test: true,
        work: true,
        requirements: {
          include: {
            certification: true,
          },
        },
        attempts: {
          select: {
            id: true,
            userId: true,
            status: true,
            passed: true,
            createdAt: true,
          },
        },
        userStates: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(challenge);
  } catch (error) {
    console.error('Error fetching challenge:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenge' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/challenges/[id] - обновить испытание
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (!user.isAdmin && !user.isManager)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      slug,
      title,
      description,
      isActive,
      // Для теста
      questionsPool,
      questionsCount,
      passingScore,
      timeLimit,
      freeAttempts,
      unlockPrice,
      // Для квалификационной работы
      instructions,
      requiredReviews,
      reviewsToPass,
      reviewPrice,
    } = body;

    // Проверка существования
    const existing = await prisma.challenge.findUnique({
      where: { id },
      include: { test: true, work: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    // Проверка уникальности slug если он изменён
    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.challenge.findUnique({
        where: { slug },
      });
      if (slugExists && slugExists.id !== id) {
        return NextResponse.json(
          { error: 'Challenge with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Обновляем испытание
    const updateData: any = {
      slug: slug || existing.slug,
      title: title || existing.title,
      description: description !== undefined ? description : existing.description,
      isActive: isActive !== undefined ? isActive : existing.isActive,
    };

    // Обновляем тест если он есть
    if (existing.test) {
      updateData.test = {
        update: {
          questionsPool: questionsPool !== undefined ? questionsPool : existing.test.questionsPool,
          questionsCount: questionsCount !== undefined ? questionsCount : existing.test.questionsCount,
          passingScore: passingScore !== undefined ? passingScore : existing.test.passingScore,
          timeLimit: timeLimit !== undefined ? timeLimit : existing.test.timeLimit,
          freeAttempts: freeAttempts !== undefined ? freeAttempts : existing.test.freeAttempts,
          unlockPrice: unlockPrice !== undefined ? (unlockPrice * 100) : existing.test.unlockPrice,
        },
      };
    }

    // Обновляем квалификационную работу если она есть
    if (existing.work) {
      updateData.work = {
        update: {
          instructions: instructions !== undefined ? instructions : existing.work.instructions,
          requiredReviews: requiredReviews !== undefined ? requiredReviews : existing.work.requiredReviews,
          reviewsToPass: reviewsToPass !== undefined ? reviewsToPass : existing.work.reviewsToPass,
          reviewPrice: reviewPrice !== undefined ? (reviewPrice * 100) : existing.work.reviewPrice,
        },
      };
    }

    const challenge = await prisma.challenge.update({
      where: { id },
      data: updateData,
      include: {
        test: true,
        work: true,
      },
    });

    return NextResponse.json(challenge);
  } catch (error) {
    console.error('Error updating challenge:', error);
    return NextResponse.json(
      { error: 'Failed to update challenge' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/challenges/[id] - удалить испытание
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (!user.isAdmin && !user.isManager)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Проверка существования
    const existing = await prisma.challenge.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    await prisma.challenge.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting challenge:', error);
    return NextResponse.json(
      { error: 'Failed to delete challenge' },
      { status: 500 }
    );
  }
}