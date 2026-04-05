import cron from "node-cron";
import { readdir, stat, rm } from "fs/promises";
import path from "path";

export function startCleanupArticleDraftsCron() {
  // Запуск каждый день в 4:00
  cron.schedule("0 4 * * *", async () => {
    console.log("[Cron] Запуск очистки draft-папок статей...");
    
    try {
      const articlesDir = path.join(process.cwd(), "public", "files", "articles");
      
      // Проверяем существование директории
      try {
        await stat(articlesDir);
      } catch {
        console.log("[Cron] Директория статей не существует, очистка не требуется");
        return;
      }
      
      const entries = await readdir(articlesDir, { withFileTypes: true });
      
      let deletedCount = 0;
      const now = Date.now();
      const twelveHours = 12 * 60 * 60 * 1000; // 12 часов в миллисекундах
      
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (!entry.name.startsWith("article-draft-")) continue;
        
        const dirPath = path.join(articlesDir, entry.name);
        const stats = await stat(dirPath);
        const age = now - stats.mtimeMs;
        
        if (age > twelveHours) {
          await rm(dirPath, { recursive: true, force: true });
          deletedCount++;
          console.log(`[Cron] Удалена старая draft-папка: ${entry.name} (возраст: ${Math.round(age / 3600000)}ч)`);
        }
      }
      
      console.log(`[Cron] ✅ Удалено ${deletedCount} draft-папок`);
    } catch (error) {
      console.error("[Cron] ❌ Ошибка очистки draft-папок:", error);
    }
  });
  
  console.log("[Cron] Задача cleanup-article-drafts зарегистрирована (4:00 ежедневно)");
}