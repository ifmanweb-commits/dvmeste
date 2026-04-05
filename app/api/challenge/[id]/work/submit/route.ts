import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/session';

// POST /api/challenge/:id/work/submit - отправить работу на проверку
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: challengeId } = await params;
    const { videoUrl, transcriptUrl } = await request.json();

    if (!videoUrl || !videoUrl.trim()) {
      return NextResponse.json(
        { error: 'Video URL is required' },
        { status: 400 }
      );
    }

    if (!transcriptUrl || !transcriptUrl.trim()) {
      return NextResponse.json(
        { error: 'Transcript URL is required' },
        { status: 400 }
      );
    }

    // Проверяем, нет ли уже отправленной работы на проверке
    const existingSubmission = await prisma.workSubmission.findFirst({
      where: {
        challengeId,
        userId: user.id,
        status: {
          in: ['SUBMITTED', 'REVIEWING'],
        },
      },
    });

    if (existingSubmission) {
      return NextResponse.json(
        { error: 'У вас уже есть работа на проверке' },
        { status: 400 }
      );
    }

    // Создаём новую работу
    const submission = await prisma.workSubmission.create({
      data: {
        challengeId,
        userId: user.id,
        videoUrl,
        transcriptUrl,
        status: 'SUBMITTED',
      },
    });

    // Списываем попытку из ChallengeUserState
    const userState = await prisma.challengeUserState.findUnique({
      where: {
        challengeId_userId: {
          challengeId,
          userId: user.id,
        },
      },
    });

    if (userState) {
      await prisma.challengeUserState.update({
        where: {
          challengeId_userId: {
            challengeId,
            userId: user.id,
          },
        },
        data: {
          attemptsLeft: { decrement: 1 },
        },
      });
    } else {
      // Если нет записи, создаём с attemptsLeft = 0 (попыток не осталось)
      await prisma.challengeUserState.create({
        data: {
          challengeId,
          userId: user.id,
          attemptsLeft: 0,
        },
      });
    }

    return NextResponse.json({
      status: 'SUBMITTED',
      message: 'Работа отправлена на проверку',
      submissionId: submission.id,
    });
  } catch (error) {
    console.error('Error submitting work:', error);
    return NextResponse.json(
      { error: 'Failed to submit work' },
      { status: 500 }
    );
  }
}