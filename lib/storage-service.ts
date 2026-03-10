import { promises as fs } from "fs";
import path from "path";

/**
 * Универсальный сервис для работы с файловой системой.
 * Не содержит логики "скоупов" или бизнес-правил приложения.
 */

// Вспомогательная функция очистки имени (Транслитерация как в твоем route.ts)
export function sanitizeFileName(input: string, fallbackExt = ""): string {
  const baseName = path.basename(input || "file");
  const parsed = path.parse(baseName);
  const rawBase = parsed.name || "file";
  const rawExt = (parsed.ext || fallbackExt || "").replace(/^\./, "");

  // Используем твою логику нормализации (предполагаем наличие функции normalizeToken или аналога)
  // Для универсальности здесь оставим базовую замену:
  const base = rawBase.toLowerCase().replace(/[^\w\.-]/g, "_").slice(0, 120);
  const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10);

  return ext ? `${base}.${ext}` : base;
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Генерация уникального имени, если файл уже существует
async function getUniqueFileName(dir: string, desiredName: string): Promise<string> {
  const parsed = path.parse(desiredName);
  let candidate = desiredName;
  let index = 2;

  while (await exists(path.join(dir, candidate))) {
    candidate = `${parsed.name}-${index}${parsed.ext}`;
    index += 1;
  }

  return candidate;
}

/**
 * Сохраняет файл в указанную директорию.
 * @param file - Объект File
 * @param targetDir - Абсолютный путь к целевой папке на сервере
 */
export async function saveFileToDisk(file: File, targetDir: string) {
  // 1. Создаем папку, если её нет
  await fs.mkdir(targetDir, { recursive: true });

  // 2. Подготавливаем имя
  const desiredName = sanitizeFileName(file.name);
  const uniqueName = await getUniqueFileName(targetDir, desiredName);
  const filePath = path.join(targetDir, uniqueName);

  // 3. Записываем байты
  const bytes = await file.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(bytes));

  return {
    fileName: uniqueName,
    size: file.size,
    absolutePath: filePath
  };
}

/**
 * Удаляет файл по абсолютному пути.
 */
export async function deleteFileFromDisk(absolutePath: string) {
  try {
    await fs.unlink(absolutePath);
    return true;
  } catch (error) {
    console.error("StorageService: Error deleting file:", error);
    return false;
  }
}