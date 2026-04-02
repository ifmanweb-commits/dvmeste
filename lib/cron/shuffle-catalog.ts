import cron from "node-cron";
import { prisma } from "@/lib/prisma";

export function startShuffleCatalogCron() {
  // Запуск каждый день в 3:00
  cron.schedule("0 3 * * *", async () => {
    console.log("[Cron] Запуск обновления порядка каталога...");
    
    try {
      // Получаем всех активных психологов
      const psychologists = await prisma.user.findMany({
        where: { isPublished: true, status: "ACTIVE" },
        select: { id: true }
      });
      
      if (psychologists.length === 0) {
        console.log("[Cron] Нет активных психологов для перемешивания");
        return;
      }
      
      // Перемешиваем массив ID (Fisher-Yates shuffle)
      const shuffledIds = psychologists.map(p => p.id);
      for (let i = shuffledIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledIds[i], shuffledIds[j]] = [shuffledIds[j], shuffledIds[i]];
      }
      
      // Формируем массивы для unnest (одинарные кавычки для строк!)
      const idArray = shuffledIds.map(id => `'${id}'`).join(',');
      const orderArray = shuffledIds.map((_, index) => index + 1).join(',');
      
      // Пакетное обновление через unnest (PostgreSQL)
      await prisma.$executeRawUnsafe(`
        UPDATE "User"
        SET "sortOrder" = orders.sort_order
        FROM (
          SELECT unnest(ARRAY[${idArray}]) AS id,
                 unnest(ARRAY[${orderArray}]) AS sort_order
        ) AS orders
        WHERE "User".id = orders.id
      `);
      
      console.log(`[Cron] ✅ Порядок каталога обновлён для ${psychologists.length} психологов`);
    } catch (error) {
      console.error("[Cron] ❌ Ошибка обновления порядка:", error);
    }
  });
  
  console.log("[Cron] Задача shuffle-catalog зарегистрирована (3:00 ежедневно)");
}
