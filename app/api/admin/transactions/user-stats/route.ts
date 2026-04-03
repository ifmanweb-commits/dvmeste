import { getCurrentUser } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        balance: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Считаем totals по типам транзакций
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      select: {
        type: true,
        amount: true,
      },
    });

    const totals = transactions.reduce(
      (acc, t) => {
        if (t.type === 'DEPOSIT' || t.type === 'EARNING') {
          acc.deposits += t.amount;
        } else if (t.type === 'PURCHASE' || t.type === 'WITHDRAWAL') {
          acc.withdrawals += Math.abs(t.amount);
        }
        return acc;
      },
      { deposits: 0, withdrawals: 0 }
    );

    return NextResponse.json({
      user: targetUser,
      stats: {
        totalDeposits: totals.deposits,
        totalWithdrawals: totals.withdrawals,
        transactionCount: transactions.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: error.message || 'Ошибка при получении статистики' },
      { status: 500 }
    );
  }
}