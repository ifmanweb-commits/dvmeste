import { randomBytes } from 'crypto'

/**
 * Генерирует случайный CSRF токен
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Проверяет валидность CSRF токена
 * @param token - Токен из заголовка запроса
 * @param cookieToken - Токен из cookie
 */
export function verifyCsrfToken(token: string | null, cookieToken: string | undefined): boolean {
  if (!token || !cookieToken) return false
  return token === cookieToken
}