import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/session';

// GET /api/supervision/submissions?tab=available|reviewing - получить работы для супервизора
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

    let submissions;

    if (tab === 'reviewing') {
      // Работы на проверке у текущего супервизора
      submissions = await prisma.workSubmission.findMany({
        where: {
          status: 'REVIEWING',
          reviewerId: user.id,
        },
        include: {
          challenge: {
            select: {
              id: true,
              title: true,
              description: true,
              price: true,
              work: true,
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
      // Доступные работы (по умолчанию)
      submissions = await prisma.workSubmission.findMany({
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
              work: true,
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

    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}