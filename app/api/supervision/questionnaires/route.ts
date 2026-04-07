import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/session';

// GET /api/supervision/questionnaires?tab=available|reviewing - получить вопросники для супервизора
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.isSupervisor) {
      return NextResponse.json({ error: 'Требуется роль супервизора' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const tab = searchParams.get('tab') || 'available';

    let questionnaires;

    if (tab === 'reviewing') {
      // Вопросники на проверке у текущего супервизора
      questionnaires = await prisma.questionnaireSubmission.findMany({
        where: {
          reviewerId: user.id,
        },
        include: {
          challenge: {
            select: {
              id: true,
              title: true,
              description: true,
              price: true,
              questionnaire: {
                select: {
                  timeLimit: true,
                  questionsPool: true,
                },
              },
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
        orderBy: {
          submittedAt: 'asc',
        },
      });
    } else {
      // Доступные вопросники (по умолчанию)
      questionnaires = await prisma.questionnaireSubmission.findMany({
        where: {
          status: 'SUBMITTED',
          reviewerId: null,
          NOT: {
            reviews: {
              some: {
                supervisorId: user.id,
              },
            },
          },
        },
        include: {
          challenge: {
            select: {
              id: true,
              title: true,
              description: true,
              price: true,
              questionnaire: {
                select: {
                  timeLimit: true,
                  questionsPool: true,
                },
              },
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
        orderBy: {
          submittedAt: 'asc',
        },
      });
    }

    return NextResponse.json(questionnaires);
  } catch (error) {
    console.error('Error fetching questionnaires:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questionnaires' },
      { status: 500 }
    );
  }
}