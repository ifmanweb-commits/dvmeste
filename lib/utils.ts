import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Нормализует URL для сравнения:
 * - Убирает домен и порт если есть
 * - Оставляет pathname + search
 * - Убирает trailing slash (кроме корня)
 * - Конвертирует в lowercase
 */
export function normalizeUrl(url: string): string {
  try {
    // Если URL начинается с http:// или https:// — парсим как полный URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const parsed = new URL(url)
      url = parsed.pathname + parsed.search
    } else if (url.startsWith('/')) {
      // Это уже путь — используем как есть
      url = url
    } else {
      // Неизвестный формат — пробуем распарсить как путь
      url = '/' + url
    }

    // Убираем trailing slash (кроме корня)
    if (url.length > 1 && url.endsWith('/')) {
      url = url.slice(0, -1)
    }

    // Конвертируем в lowercase для консистентности
    return url.toLowerCase()
  } catch {
    // Если не удалось распарсить — возвращаем как есть
    return url.toLowerCase()
  }
}