import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.isSupervisor) {
      return NextResponse.json(
        { error: 'Доступно только супервизорам' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { amount } = body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Некорректная сумма' },
        { status: 400 }
      );
    }

    // Получаем текущий баланс пользователя
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { balance: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    if (amount > currentUser.balance) {
      return NextResponse.json(
        { error: 'Недостаточно средств на балансе' },
        { status: 400 }
      );
    }

    // Создаём заявку и транзакцию в одной транзакции
    const result = await prisma.$transaction(async (tx) => {
      // Списываем средства с баланса
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { balance: currentUser.balance - amount },
      });

      // Создаём транзакцию
      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'WITHDRAWAL',
          amount: amount,
          balanceAfter: updatedUser.balance,
          description: 'Вывод средств',
          metadata: { withdrawalRequest: 'pending' },
        },
      });

      // Создаём заявку на вывод
      const withdrawalRequest = await tx.withdrawalRequest.create({
        data: {
          userId: user.id,
          amount: amount,
          status: 'PENDING',
        },
      });

      return { withdrawalRequest, transaction, newBalance: updatedUser.balance };
    });

    return NextResponse.json({
      success: true,
      withdrawalRequest: result.withdrawalRequest,
      newBalance: result.newBalance,
    });
  } catch (error: any) {
    console.error('Error creating withdrawal request:', error);
    return NextResponse.json(
      { error: error.message || 'Ошибка при создании заявки' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.isSupervisor) {
      return NextResponse.json(
        { error: 'Доступно только супервизорам' },
        { status: 403 }
      );
    }

    const requests = await prisma.withdrawalRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        moderator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ items: requests });
  } catch (error: any) {
    console.error('Error fetching withdrawal requests:', error);
    return NextResponse.json(
      { error: error.message || 'Ошибка при получении заявок' },
      { status: 500 }
    );
  }
}