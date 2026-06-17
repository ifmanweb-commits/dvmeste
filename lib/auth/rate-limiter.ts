import { prisma } from '@/lib/prisma'
import { getRateLimitRule, createRateLimitKey, type RateLimitRule } from '@/lib/auth/rate-limit-config'

/**
 * Универсальная проверка rate limit
 * 
 * @param action - тип операции (login, file-upload, etc)
 * @param identifier - идентификатор (email, userId, IP)
 * @returns информация о текущем состоянии лимита
 */
export async function checkRateLimit(action: string, identifier: string): Promise<{
  isLimited: boolean
  remainingAttempts: number
  resetAt: Date | null
  rule: RateLimitRule
}> {
  const rule = getRateLimitRule(action)
  const key = createRateLimitKey(action, identifier)
  
  const now = new Date()
  
  // Ищем активную запись с лимитом
  const rateLimit = await prisma.rateLimit.findUnique({
    where: { key }
  })
  
  // Если записи нет или она истекла - лимита нет
  if (!rateLimit || rateLimit.expiresAt < now) {
    return {
      isLimited: false,
      remainingAttempts: rule.maxAttempts,
      resetAt: null,
      rule
    }
  }
  
  const remainingAttempts = rule.maxAttempts - rateLimit.count
  const isLimited = remainingAttempts <= 0
  
  return {
    isLimited,
    remainingAttempts: Math.max(0, remainingAttempts),
    resetAt: rateLimit.expiresAt,
    rule
  }
}

/**
 * Увеличивает счетчик попыток
 * 
 * @param action - тип операции
 * @param identifier - идентификатор
 * @returns обновлённое состояние лимита
 */
export async function incrementAttempt(action: string, identifier: string): Promise<{
  isLimited: boolean
  remainingAttempts: number
  resetAt: Date
  rule: RateLimitRule
}> {
  const rule = getRateLimitRule(action)
  const key = createRateLimitKey(action, identifier)
  
  const now = new Date()
  const expiresAt = new Date(now.getTime() + rule.windowMs)
  
  // Используем upsert для атомарного обновления
  const rateLimit = await prisma.rateLimit.upsert({
    where: { key },
    update: {
      count: { increment: 1 },
      expiresAt
    },
    create: {
      key,
      count: 1,
      expiresAt
    }
  })
  
  const remainingAttempts = rule.maxAttempts - rateLimit.count
  const isLimited = remainingAttempts <= 0
  
  return {
    isLimited,
    remainingAttempts: Math.max(0, remainingAttempts),
    resetAt: expiresAt,
    rule
  }
}

/**
 * Сбрасывает счетчик попыток (при успешном выполнении операции)
 * 
 * @param action - тип операции
 * @param identifier - идентификатор
 */
export async function resetAttempts(action: string, identifier: string): Promise<void> {
  const key = createRateLimitKey(action, identifier)
  
  await prisma.rateLimit.delete({
    where: { key }
  }).catch(() => {
    // Игнорируем ошибку если записи не существует
  })
}

/**
 * Проверяет, нужно ли требовать капчу
 */
export function shouldRequireCaptcha(remainingAttempts: number, rule: RateLimitRule): boolean {
  if (rule.requireCaptchaAfter === 0) return false
  return remainingAttempts <= (rule.maxAttempts - rule.requireCaptchaAfter)
}

// ==========================================
// Обратная совместимость — legacy функции для login
// ==========================================

/**
 * @deprecated Используйте checkRateLimit('login', email)
 */
export async function checkLoginRateLimit(email: string): Promise<{
  isLimited: boolean
  remainingAttempts: number
  resetAt: Date | null
}> {
  const result = await checkRateLimit('login', email)
  return {
    isLimited: result.isLimited,
    remainingAttempts: result.remainingAttempts,
    resetAt: result.resetAt
  }
}

/**
 * @deprecated Используйте incrementAttempt('login', email)
 */
export async function incrementLoginAttempt(email: string): Promise<{
  isLimited: boolean
  remainingAttempts: number
  resetAt: Date
}> {
  const result = await incrementAttempt('login', email)
  return {
    isLimited: result.isLimited,
    remainingAttempts: result.remainingAttempts,
    resetAt: result.resetAt
  }
}

/**
 * @deprecated Используйте resetAttempts('login', email)
 */
export async function resetLoginAttempts(email: string): Promise<void> {
  return resetAttempts('login', email)
}

/**
 * Проверяет капчу на сервере
 */
export async function verifySmartCaptcha(token: string): Promise<{
  success: boolean
  error?: string
}> {
  if (!token) {
    return { success: false, error: 'Капча не предоставлена' }
  }
  
  const serverKey = process.env.SMARTCAPTCHA_SERVER_KEY
  
  if (!serverKey) {
    console.error('SMARTCAPTCHA_SERVER_KEY не настроен')
    return { success: false, error: 'Серверная ошибка капчи' }
  }
  
  try {
    const response = await fetch('https://smartcaptcha.yandexcloud.net/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: serverKey,
        token,
        ip: '{{REMOTE_ADDR}}' // Yandex сам определит IP из запроса
      })
    })
    
    const data = await response.json()
    
    if (data.status === 'ok') {
      return { success: true }
    } else {
      return { 
        success: false, 
        error: data.error_codes?.join(', ') || 'Неверная капча' 
      }
    }
  } catch (error) {
    console.error('SmartCaptcha validation error:', error)
    return { success: false, error: 'Ошибка проверки капчи' }
  }
}