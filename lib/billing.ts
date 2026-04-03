import { prisma } from '@/lib/prisma';
import { TransactionType } from '@prisma/client';

/**
 * Получить текущий баланс пользователя
 */
export async function getBalance(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balance: true },
  });

  return user?.balance ?? 0;
}

/**
 * Получить историю транзакций пользователя с пагинацией
 */
export async function getTransactions(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{
  items: Array<{
    id: string;
    type: TransactionType;
    amount: number;
    balanceAfter: number;
    description: string;
    paymentId: string | null;
    metadata: any;
    createdAt: Date;
  }>;
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}> {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      skip,
      take: limit + 1, // Берём на 1 больше для проверки hasMore
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        amount: true,
        balanceAfter: true,
        description: true,
        paymentId: true,
        metadata: true,
        createdAt: true,
      },
    }),
    prisma.transaction.count({
      where: { userId },
    }),
  ]);

  let hasMore = false;
  let resultItems = items;

  if (items.length > limit) {
    hasMore = true;
    resultItems = items.slice(0, limit);
  }

  return {
    items: resultItems,
    total,
    page,
    limit,
    hasMore,
  };
}

/**
 * Проверить достаточность средств на счёте
 */
export async function hasSufficientFunds(
  userId: string,
  requiredAmount: number
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balance: true },
  });

  return (user?.balance ?? 0) >= requiredAmount;
}

/**
 * Списание средств за услугу
 * @param userId - ID пользователя
 * @param amount - сумма в копейках
 * @param description - описание операции
 * @param metadata - дополнительные данные (serviceId, serviceType)
 */
export async function chargeForService(
  userId: string,
  amount: number,
  description: string,
  metadata?: { serviceId: string; serviceType: string }
): Promise<{ success: boolean; error?: string; newBalance?: number }> {
  if (amount <= 0) {
    return { success: false, error: 'Сумма должна быть положительной' };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balance: true },
  });

  const currentBalance = user?.balance ?? 0;

  if (currentBalance < amount) {
    return { success: false, error: 'Недостаточно средств' };
  }

  const newBalance = currentBalance - amount;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { balance: newBalance },
    }),
    prisma.transaction.create({
      data: {
        userId,
        type: 'PURCHASE',
        amount: -amount, // отрицательная сумма для списания
        balanceAfter: newBalance,
        description,
        metadata: metadata || {},
      },
    }),
  ]);

  return { success: true, newBalance };
}

/**
 * Пополнение счёта (внешняя оплата)
 * @param userId - ID пользователя
 * @param amount - сумма в копейках
 * @param paymentId - уникальный ID платежа (для защиты от дублей)
 * @param description - описание операции
 */
export async function depositFunds(
  userId: string,
  amount: number,
  paymentId: string,
  description: string
): Promise<{ success: boolean; error?: string; newBalance?: number }> {
  if (amount <= 0) {
    return { success: false, error: 'Сумма должна быть положительной' };
  }

  // Проверка на дубликат paymentId
  const existingTransaction = await prisma.transaction.findUnique({
    where: { paymentId },
  });

  if (existingTransaction) {
    return { success: false, error: 'Платёж уже был обработан' };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balance: true },
  });

  const currentBalance = user?.balance ?? 0;
  const newBalance = currentBalance + amount;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { balance: newBalance },
    }),
    prisma.transaction.create({
      data: {
        userId,
        type: 'DEPOSIT',
        amount, // положительная сумма для пополнения
        balanceAfter: newBalance,
        description,
        paymentId,
      },
    }),
  ]);

  return { success: true, newBalance };
}

/**
 * Ручное зачисление/корректировка баланса (админ)
 * @param userId - ID пользователя
 * @param amount - сумма в копейках (может быть отрицательной для списания)
 * @param description - описание операции
 */
export async function manualAdjustment(
  userId: string,
  amount: number,
  description: string
): Promise<{ success: boolean; error?: string; newBalance?: number }> {
  if (amount === 0) {
    return { success: false, error: 'Сумма не может быть нулевой' };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balance: true },
  });

  const currentBalance = user?.balance ?? 0;
  const newBalance = currentBalance + amount;

  if (newBalance < 0) {
    return { success: false, error: 'Баланс не может быть отрицательным' };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { balance: newBalance },
    }),
    prisma.transaction.create({
      data: {
        userId,
        type: 'ADJUSTMENT',
        amount,
        balanceAfter: newBalance,
        description,
      },
    }),
  ]);

  return { success: true, newBalance };
}

/**
 * Начисление супервизору за проверку работы
 * @param supervisorId - ID супервизора
 * @param amount - сумма в копейках
 * @param reviewId - ID проверки (ревью)
 * @param description - описание операции
 */
export async function creditSupervisor(
  supervisorId: string,
  amount: number,
  reviewId: string,
  description: string
): Promise<{ success: boolean; error?: string; newBalance?: number }> {
  if (amount <= 0) {
    return { success: false, error: 'Сумма должна быть положительной' };
  }

  const user = await prisma.user.findUnique({
    where: { id: supervisorId },
    select: { balance: true },
  });

  const currentBalance = user?.balance ?? 0;
  const newBalance = currentBalance + amount;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: supervisorId },
      data: { balance: newBalance },
    }),
    prisma.transaction.create({
      data: {
        userId: supervisorId,
        type: 'EARNING',
        amount, // положительная сумма для начисления
        balanceAfter: newBalance,
        description,
        metadata: { reviewId },
      },
    }),
  ]);

  return { success: true, newBalance };
}

/**
 * Пересчёт баланса из транзакций (для сверки)
 * Суммирует все amount из транзакций пользователя
 */
export async function recalculateBalance(userId: string): Promise<number> {
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    select: { amount: true },
  });

  const calculatedBalance = transactions.reduce((sum, t) => sum + t.amount, 0);

  // Обновляем баланс пользователя
  await prisma.user.update({
    where: { id: userId },
    data: { balance: calculatedBalance },
  });

  return calculatedBalance;
}

/**
 * Форматирование суммы в рубли (из копеек)
 */
export function formatAmount(amountInKopecks: number): string {
  const rubles = amountInKopecks / 100;
  return rubles.toLocaleString('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
  });
}

/**
 * Получить тип транзакции в читаемом виде
 */
export function getTransactionTypeLabel(type: TransactionType): string {
  const labels: Record<TransactionType, string> = {
    DEPOSIT: 'Пополнение',
    WITHDRAWAL: 'Вывод средств',
    PURCHASE: 'Покупка',
    EARNING: 'Начисление',
    ADJUSTMENT: 'Корректировка',
  };
  return labels[type];
}