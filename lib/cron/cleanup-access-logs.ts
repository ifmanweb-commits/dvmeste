import cron from "node-cron";
import { prisma } from "@/lib/prisma";

export function startCleanupAccessLogsCron() {
  // Запуск каждую неделю в воскресенье в 3:00
  cron.schedule("0 3 * * 0", async () => {
    console.log("[Cron] Запуск очистки старых записей AccessLog...");
    
    try {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      const result = await prisma.accessLog.deleteMany({
        where: {
          createdAt: {
            lt: oneYearAgo
          }
        }
      });
      
      console.log(`[Cron] ✅ Удалено ${result.count} записей AccessLog старше 1 года`);
    } catch (error) {
      console.error("[Cron] ❌ Ошибка очистки AccessLog:", error);
    }
  });
  
  console.log("[Cron] Задача cleanup-access-logs зарегистрирована (воскресенье 3:00 еженедельно)");
}