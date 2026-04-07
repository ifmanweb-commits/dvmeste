import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/session';

// GET /api/challenge/[id]/type - получить тип испытания по id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const challenge = await prisma.challenge.findUnique({
      where: { id },
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        work: {
          select: {
            instructions: true,
            requiredReviews: true,
            reviewsToPass: true,
          },
        },
        questionnaire: {
          select: {
            timeLimit: true,
            questionsPool: true,
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

    return NextResponse.json({
      id: challenge.id,
      type: challenge.type,
      title: challenge.title,
      description: challenge.description,
      work: challenge.type === 'WORK' ? challenge.work : null,
      questionnaire: challenge.type === 'QUESTIONNAIRE' ? challenge.questionnaire : null,
    });
  } catch (error) {
    console.error('Error fetching challenge type:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenge type' },
      { status: 500 }
    );
  }
}