/**
 * Конфигурация Rate Limiting для различных операций
 * 
 * Каждая операция имеет свой лимит попыток, окно времени и порог капчи
 */

export interface RateLimitRule {
  /** Максимум попыток в окне */
  maxAttempts: number
  /** Окно времени в миллисекундах */
  windowMs: number
  /** После скольки попыток требовать капчу (0 = не требовать) */
  requireCaptchaAfter: number
  /** Описание для логов */
  description: string
}

/**
 * Правила rate limiting по типам операций
 * 
 * Ключи используются как префикс в RateLimit.key
 * Например: "login:user@email.com", "file-upload:userId123"
 */
export const RATE_LIMIT_RULES: Record<string, RateLimitRule> = {
  /**
   * Авторизация через magic link
   * Строгий лимит + капча после превышения
   */
  'login': {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000,        // 1 час
    requireCaptchaAfter: 3,
    description: 'Попытки входа в систему'
  },

  /**
   * Загрузка файлов
   * Более мягкий лимит, без капчи
   */
  'file-upload': {
    maxAttempts: 20,
    windowMs: 60 * 60 * 1000,        // 1 час
    requireCaptchaAfter: 0,
    description: 'Загрузка файлов'
  },

  /**
   * Изменение профиля пользователя
   */
  'profile-update': {
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000,        // 1 час
    requireCaptchaAfter: 0,
    description: 'Изменение профиля'
  },

  /**
   * Административные действия
   * Относительно мягкий лимит для удобства админов
   */
  'admin-action': {
    maxAttempts: 50,
    windowMs: 60 * 60 * 1000,        // 1 час
    requireCaptchaAfter: 0,
    description: 'Административные действия'
  },

  /**
   * Активация ключей доступа
   * Средний лимит + капча после нескольких попыток
   */
  'key-activate': {
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000,        // 1 час
    requireCaptchaAfter: 5,
    description: 'Активация ключей'
  },

  /**
   * Отправка сообщений
   */
  'message-send': {
    maxAttempts: 30,
    windowMs: 60 * 60 * 1000,        // 1 час
    requireCaptchaAfter: 0,
    description: 'Отправка сообщений'
  },

  /**
   * Сброс пароля
   */
  'password-reset': {
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000,        // 1 час
    requireCaptchaAfter: 3,
    description: 'Сброс пароля'
  },

  /**
   * Регистрация новых пользователей
   */
  'registration': {
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000,        // 1 час
    requireCaptchaAfter: 3,
    description: 'Регистрация'
  }
}

/**
 * Получить правило по типу операции
 * Бросает ошибку если правило не найдено
 */
export function getRateLimitRule(action: string): RateLimitRule {
  const rule = RATE_LIMIT_RULES[action]
  if (!rule) {
    throw new Error(`Rate limit rule not found for action: ${action}`)
  }
  return rule
}

/**
 * Создать ключ для RateLimit таблицы
 */
export function createRateLimitKey(action: string, identifier: string): string {
  return `${action}:${identifier}`
}