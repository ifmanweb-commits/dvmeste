import cron from "node-cron";
import { prisma } from "@/lib/prisma";

/**
 * Возвращает количество баллов для статьи в зависимости от её возраста
 * Логика: 6,5,4,3,3,3 по месяцам (0-5 месяцы), после 6 месяцев = 0
 */
function calculateBonusForArticle(monthsOld: number): number {
  if (monthsOld < 0) return 6; // Статья ещё не достигла возраста 0 месяцев (только что одобрена)
  if (monthsOld === 0) return 6; // Первый месяц (0-1 месяц)
  if (monthsOld === 1) return 5; // Второй месяц
  if (monthsOld === 2) return 4; // Третий месяц
  if (monthsOld === 3) return 3; // Четвёртый месяц
  if (monthsOld === 4) return 3; // Пятый месяц
  if (monthsOld === 5) return 3; // Шестой месяц
  return 0; // Старше 6 месяцев
}

/**
 * Вычисляет возраст статьи в полных месяцах
 */
function getArticleAgeInMonths(approvedAt: Date): number {
  const now = new Date();
  const approvedDate = new Date(approvedAt);
  
  const yearsDiff = now.getFullYear() - approvedDate.getFullYear();
  const monthsDiff = now.getMonth() - approvedDate.getMonth();
  
  const totalMonths = yearsDiff * 12 + monthsDiff;
  
  // Учитываем день месяца для более точного расчёта
  if (now.getDate() < approvedDate.getDate()) {
    return Math.max(0, totalMonths - 1);
  }
  
  return Math.max(0, totalMonths);
}

/**
 * Основная функция пересчёта баллов за статьи
 * Возвращает количество обновлённых пользователей
 */
export async function recalculateArticleBonus(): Promise<number> {
  console.log("[Cron] Запуск пересчёта бонусов статей...");
  
  try {
    // Получаем все одобренные статьи
    const articles = await prisma.article.findMany({
      where: {
        moderationStatus: "APPROVED",
      },
      include: {
        user: true,
      },
    });
    
    console.log(`[Cron] Найдено ${articles.length} одобренных статей`);
    
    // Группируем статьи по пользователям
    const userBonuses = new Map<string, { userId: string; totalBonus: number }>();
    
    for (const article of articles) {
      // Пропускаем статьи без пользователя
      if (!article.userId) {
        console.log(`[Cron] Статья "${article.title}" (${article.id}) не имеет userId, пропускаем`);
        continue;
      }
      
      // Вычисляем возраст статьи
      const approvedAt = article.moderatedAt || article.createdAt;
      const monthsOld = getArticleAgeInMonths(approvedAt);
      
      // Рассчитываем баллы для этой статьи
      const newBonusPoints = calculateBonusForArticle(monthsOld);
      
      // Обновляем баллы у статьи если изменились
      if (article.bonusPoints !== newBonusPoints) {
        await prisma.article.update({
          where: { id: article.id },
          data: { bonusPoints: newBonusPoints },
        });
        console.log(`[Cron] Статья "${article.title}" (${article.id}): возраст ${monthsOld} мес., баллы: ${article.bonusPoints} → ${newBonusPoints}`);
      }
      
      // Суммируем баллы для пользователя
      const existing = userBonuses.get(article.userId);
      if (existing) {
        existing.totalBonus += newBonusPoints;
      } else {
        userBonuses.set(article.userId, {
          userId: article.userId,
          totalBonus: newBonusPoints,
        });
      }
    }
    
    // Обновляем totalBonus у каждого пользователя
    let updatedUsersCount = 0;
    for (const [userId, data] of userBonuses) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { totalBonus: true },
      });
      
      if (user && user.totalBonus !== data.totalBonus) {
        await prisma.user.update({
          where: { id: userId },
          data: { totalBonus: data.totalBonus },
        });
        console.log(`[Cron] Пользователь ${userId}: totalBonus → ${data.totalBonus}`);
        updatedUsersCount++;
      }
    }
    
    console.log(`[Cron] ✅ Пересчёт завершён. Обновлено пользователей: ${updatedUsersCount}`);
    return updatedUsersCount;
  } catch (error) {
    console.error("[Cron] ❌ Ошибка пересчёта бонусов:", error);
    throw error;
  }
}

export function startRecalculateArticleBonusCron() {
  // Запуск каждый день в 3:00
  cron.schedule("0 3 * * *", async () => {
    await recalculateArticleBonus();
  });
  
  console.log("[Cron] Задача recalculate-article-bonus зарегистрирована (3:00 ежедневно)");
}
