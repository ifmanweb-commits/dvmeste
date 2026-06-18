import cron from "node-cron";
import { prisma } from "@/lib/prisma";

export function startCleanupSystemLogsCron() {
  // Запуск каждый день в 4:00
  cron.schedule("0 4 * * *", async () => {
    console.log("[Cron] Запуск очистки старых системных логов...");
    
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const result = await prisma.systemLog.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo
          }
        }
      });
      
      console.log(`[Cron] ✅ Удалено ${result.count} системных логов старше 30 дней`);
    } catch (error) {
      console.error("[Cron] ❌ Ошибка очистки системных логов:", error);
    }
  });
  
  console.log("[Cron] Задача cleanup-system-logs зарегистрирована (ежедневно в 4:00)");
}