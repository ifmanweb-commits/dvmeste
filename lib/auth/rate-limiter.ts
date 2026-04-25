import { prisma } from '@/lib/prisma'

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 час
const MAX_ATTEMPTS = 3

/**
 * Проверяет лимит попыток входа для email
 * Возвращает информацию о текущем состоянии
 */
export async function checkRateLimit(email: string): Promise<{
  isLimited: boolean
  remainingAttempts: number
  resetAt: Date | null
}> {
  const normalizedEmail = email.toLowerCase().trim()
  const key = `login:${normalizedEmail}`
  
  const now = new Date()
  
  // Ищем активную запись с лимитом
  const rateLimit = await prisma.rateLimit.findUnique({
    where: { key }
  })
  
  // Если записи нет или она истекла - лимита нет
  if (!rateLimit || rateLimit.expiresAt < now) {
    return {
      isLimited: false,
      remainingAttempts: MAX_ATTEMPTS,
      resetAt: null
    }
  }
  
  const remainingAttempts = MAX_ATTEMPTS - rateLimit.count
  const isLimited = remainingAttempts <= 0
  
  return {
    isLimited,
    remainingAttempts,
    resetAt: rateLimit.expiresAt
  }
}

/**
 * Увеличивает счетчик попыток для email
 */
export async function incrementLoginAttempt(email: string): Promise<{
  isLimited: boolean
  remainingAttempts: number
  resetAt: Date
}> {
  const normalizedEmail = email.toLowerCase().trim()
  const key = `login:${normalizedEmail}`
  
  const now = new Date()
  const expiresAt = new Date(now.getTime() + RATE_LIMIT_WINDOW_MS)
  
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
  
  const remainingAttempts = MAX_ATTEMPTS - rateLimit.count
  const isLimited = remainingAttempts <= 0
  
  return {
    isLimited,
    remainingAttempts: Math.max(0, remainingAttempts),
    resetAt: expiresAt
  }
}

/**
 * Сбрасывает счетчик попыток для email (при успешном входе)
 */
export async function resetLoginAttempts(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim()
  const key = `login:${normalizedEmail}`
  
  await prisma.rateLimit.delete({
    where: { key }
  }).catch(() => {
    // Игнорируем ошибку если записи не существует
  })
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