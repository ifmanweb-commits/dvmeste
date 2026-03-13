import { prisma } from "@/lib/prisma";

export async function calculateArticleCreditPeriod(userId: string) {
  // Находим последний зачёт пользователя
  const lastCredit = await prisma.articleCredit.findFirst({
    where: { userId },
    orderBy: [{ year: 'desc' }, { month: 'desc' }]
  });

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  if (!lastCredit) {
    // Первая статья — за текущий месяц
    return { month: currentMonth, year: currentYear };
  }

  // Вычисляем следующий месяц
  let nextMonth = lastCredit.month + 1;
  let nextYear = lastCredit.year;

  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }

  // Не можем зачесть будущий месяц
  if (nextYear > currentYear || (nextYear === currentYear && nextMonth > currentMonth)) {
    return { month: currentMonth, year: currentYear };
  }

  return { month: nextMonth, year: nextYear };
}