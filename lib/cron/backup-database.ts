import cron from "node-cron";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";

const execAsync = promisify(exec);

const BACKUP_DIR = "/app/backups";
const MAX_BACKUPS = 30;

/**
 * Форматирует число с ведущим нулем
 */
function pad(num: number): string {
  return num.toString().padStart(2, "0");
}

/**
 * Форматирует дату для имени файла
 * Пример: 2025-01-27_033000
 */
function formatTimestamp(date: Date): string {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  
  return `${year}-${month}-${day}_${hours}${minutes}${seconds}`;
}

/**
 * Получает размер файла в человекочитаемом формате
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + " " + sizes[i];
}

/**
 * Удаляет старые бекапы, оставляя только MAX_BACKUPS последних
 */
async function cleanupOldBackups(): Promise<void> {
  try {
    const files = await fs.promises.readdir(BACKUP_DIR);
    const backupFiles = files
      .filter(f => f.startsWith("backup_") && f.endsWith(".sql.gz"))
      .sort()
      .reverse(); // Сортируем по убыванию (новые первые)

    if (backupFiles.length > MAX_BACKUPS) {
      const toDelete = backupFiles.slice(MAX_BACKUPS);
      for (const file of toDelete) {
        const filepath = path.join(BACKUP_DIR, file);
        await fs.promises.unlink(filepath);
        console.log(`[Backup] 🗑️ Удален старый бекап: ${file}`);
      }
    }
  } catch (error) {
    console.error("[Backup] ❌ Ошибка при очистке старых бекапов:", error);
  }
}

/**
 * Создает дамп базы данных
 * @returns Объект с результатом операции
 */
export async function backupDatabase(): Promise<{ success: boolean; filename?: string; size?: string; error?: string }> {
  const timestamp = formatTimestamp(new Date());
  const filename = `backup_${timestamp}.sql.gz`;
  const filepath = path.join(BACKUP_DIR, filename);

  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error("[Backup] ❌ DATABASE_URL не задана");
    return { success: false, error: "DATABASE_URL не задана" };
  }

  // Парсим DATABASE_URL для извлечения параметров подключения
  // Формат: postgresql://user:password@host:port/database?params
  let pgDumpCommand: string;
  let password: string;
  
  try {
    const url = new URL(dbUrl);
    const host = url.hostname;
    const port = url.port || "5432";
    const database = url.pathname.slice(1);
    const user = url.username;
    password = url.password;

    // Формируем команду pg_dump
    pgDumpCommand = `pg_dump -h ${host} -p ${port} -U ${user} -d ${database}`;
  } catch (error) {
    console.error("[Backup] ❌ Ошибка парсинга DATABASE_URL:", error);
    return { success: false, error: "Ошибка парсинга DATABASE_URL" };
  }

  try {
    // Убеждаемся, что директория существует
    await fs.promises.mkdir(BACKUP_DIR, { recursive: true });

    // Выполняем дамп с передачей пароля через env (кроссплатформенно)
    await execAsync(pgDumpCommand, {
      maxBuffer: 1024 * 1024 * 1024, // 1GB буфер
      env: { ...process.env, PGPASSWORD: password },
    });

    // Сжимаем файл отдельно (кроссплатформенно)
    const gzipFilepath = filepath.replace(/\\/g, '/');
    await execAsync(`gzip -f "${gzipFilepath}"`, {
      maxBuffer: 1024 * 1024 * 1024,
    });

    // Получаем размер файла
    const stats = await fs.promises.stat(filepath);
    const size = formatFileSize(stats.size);

    console.log(`[Backup] ✅ Backup created: ${filename} (size: ${size})`);

    // Очищаем старые бекапы
    await cleanupOldBackups();
    
    return { success: true, filename, size };
  } catch (error) {
    console.error("[Backup] ❌ Backup failed:", error);
    
    // Пытаемся удалить неполный файл, если он создан
    try {
      await fs.promises.unlink(filepath);
    } catch (e) {
      // Игнорируем ошибку, если файл не существует
    }
    
    return { success: false, error: error instanceof Error ? error.message : "Неизвестная ошибка" };
  }
}

/**
 * Получает информацию о последнем бекапе
 * @returns Объект с информацией о последнем бекапе или null, если бекапов нет
 */
export async function getLastBackupInfo(): Promise<{ filename: string; date: Date; timestamp: string } | null> {
  try {
    const files = await fs.promises.readdir(BACKUP_DIR);
    const backupFiles = files
      .filter(f => f.startsWith("backup_") && f.endsWith(".sql.gz"))
      .sort()
      .reverse();

    if (backupFiles.length === 0) {
      return null;
    }

    const lastBackup = backupFiles[0];
    // Парсим дату из имени файла: backup_YYYY-MM-DD_HHMMSS.sql.gz
    const match = lastBackup.match(/backup_(\d{4}-\d{2}-\d{2})_(\d{2})(\d{2})(\d{2})\.sql\.gz/);
    
    if (!match) {
      return null;
    }

    const [, dateStr, hours, minutes, seconds] = match;
    const date = new Date(`${dateStr}T${hours}:${minutes}:${seconds}`);

    return {
      filename: lastBackup,
      date,
      timestamp: `${dateStr} ${hours}:${minutes}:${seconds}`
    };
  } catch (error) {
    console.error("[Backup] ❌ Ошибка получения информации о последнем бекапе:", error);
    return null;
  }
}

/**
 * Запускает cron-задачу для создания бекапов
 * Расписание: каждый день в 3:30
 */
export function startBackupDatabaseCron() {
  cron.schedule("30 3 * * *", async () => {
    console.log("[Backup] 🕐 Запуск создания бекапа БД...");
    await backupDatabase();
  });

  console.log("[Backup] Задача backup-database зарегистрирована (3:30 ежедневно)");
}
