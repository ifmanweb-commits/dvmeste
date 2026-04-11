import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Некорректный статус' },
        { status: 400 }
      );
    }

    // Находим заявку
    const withdrawalRequest = await prisma.withdrawalRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            balance: true,
          },
        },
      },
    });

    if (!withdrawalRequest) {
      return NextResponse.json(
        { error: 'Заявка не найдена' },
        { status: 404 }
      );
    }

    if (withdrawalRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Заявка уже обработана' },
        { status: 400 }
      );
    }

    // Обновляем заявку
    const updatedRequest = await prisma.withdrawalRequest.update({
      where: { id },
      data: {
        status,
        moderatorId: user.id,
        processedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        moderator: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      withdrawalRequest: updatedRequest,
    });
  } catch (error: any) {
    console.error('Error processing withdrawal request:', error);
    return NextResponse.json(
      { error: error.message || 'Ошибка при обработке заявки' },
      { status: 500 }
    );
  }
}