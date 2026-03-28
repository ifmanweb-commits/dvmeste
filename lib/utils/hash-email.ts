import { createHash } from 'crypto';

/**
 * Создает SHA-256 хеш email для поиска в базе данных
 * @param email - Email адрес
 * @returns Хеш в формате hex
 */
export function hashEmail(email: string): string {
  return createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}