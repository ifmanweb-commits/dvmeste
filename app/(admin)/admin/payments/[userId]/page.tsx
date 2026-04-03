import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { UserBillingClient } from './UserBillingClient';
import { prisma } from '@/lib/prisma';

export default async function UserBillingPage({ params }: { params: Promise<{ userId: string }> }) {
  const user = await getCurrentUser();

  if (!user || !user.isAdmin) {
    redirect('/auth/login');
  }

  const { userId } = await params;

  // Получаем данные пользователя
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      balance: true,
      createdAt: true,
    },
  });

  if (!targetUser) {
    redirect('/admin/payments');
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

  const stats = {
    totalDeposits: totals.deposits,
    totalWithdrawals: totals.withdrawals,
    transactionCount: transactions.length,
  };

  return <UserBillingClient user={targetUser} stats={stats} />;
}