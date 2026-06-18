/**
 * Система логирования технических логов в БД
 * 
 * Перехватывает console.log/error/warn/info и дублирует их в БД.
 * Оригинальное поведение (stdout/stderr) сохраняется.
 * Если БД недоступна — логи пишутся только в stdout (fallback).
 */

type LogLevel = 'LOG' | 'ERROR' | 'WARN' | 'INFO'

interface LogEntry {
  level: LogLevel
  message: string
  stack?: string
  source?: string
  userId?: string
  requestId?: string
  url?: string
}

// Флаг чтобы избежать рекурсии (лог при записи лога)
let isWritingToDb = false

// Буфер для логов когда БД недоступна
const buffer: LogEntry[] = []
const MAX_BUFFER_SIZE = 1000

/**
 * Записывает лог в БД асинхронно (не блокирует основную операцию)
 */
async function writeToDatabase(entry: LogEntry): Promise<void> {
  if (isWritingToDb) return // Защита от рекурсии
  
  try {
    isWritingToDb = true
    
    const { prisma } = await import('@/lib/prisma')
    
    await prisma.systemLog.create({
      data: {
        level: entry.level,
        message: entry.message,
        stack: entry.stack || null,
        source: entry.source || null,
        userId: entry.userId || null,
        requestId: entry.requestId || null,
        url: entry.url || null,
      }
    })
    
    // Если есть буферизованные логи — записываем их
    while (buffer.length > 0) {
      const buffered = buffer.shift()!
      try {
        await prisma.systemLog.create({
          data: {
            level: buffered.level,
            message: buffered.message,
            stack: buffered.stack || null,
            source: buffered.source || null,
            userId: buffered.userId || null,
            requestId: buffered.requestId || null,
            url: buffered.url || null,
          }
        })
      } catch {
        // Если буферный лог не записался — возвращаем в буфер
        buffer.unshift(buffered)
        break
      }
    }
  } catch {
    // БД недоступна — буферизуем
    if (buffer.length < MAX_BUFFER_SIZE) {
      buffer.push(entry)
    }
  } finally {
    isWritingToDb = false
  }
}

/**
 * Определяем уровень лога
 */
function getLevel(method: 'log' | 'error' | 'warn' | 'info'): LogLevel {
  switch (method) {
    case 'error': return 'ERROR'
    case 'warn': return 'WARN'
    case 'info': return 'INFO'
    default: return 'LOG'
  }
}

/**
 * Извлекаем стек из ошибки
 */
function extractStack(args: any[]): string | undefined {
  for (const arg of args) {
    if (arg instanceof Error && arg.stack) {
      return arg.stack
    }
  }
  return undefined
}

/**
 * Определяем источник (файл откуда вызван console.log)
 * Использует stack trace для определения места вызова
 */
function extractSource(): string | undefined {
  const error = new Error()
  const stack = error.stack?.split('\n')
  if (stack && stack.length > 3) {
    // Ищем первый фрейм не из system-logger
    for (let i = 3; i < stack.length; i++) {
      const match = stack[i].match(/\((.+?):\d+:\d+\)/)
      if (match && !match[1].includes('system-logger')) {
        // Преобразуем абсолютный путь в относительный
        const fullPath = match[1]
        const appIndex = fullPath.indexOf('/app/')
        const libIndex = fullPath.indexOf('/lib/')
        if (appIndex !== -1) {
          return fullPath.substring(appIndex + 1)
        }
        if (libIndex !== -1) {
          return fullPath.substring(libIndex + 1)
        }
        return fullPath
      }
    }
  }
  return undefined
}

/**
 * Сериализуем аргументы в строку
 */
function serializeArgs(args: any[]): string {
  return args.map(arg => {
    if (typeof arg === 'string') return arg
    if (arg instanceof Error) return arg.message
    if (arg === null) return 'null'
    if (arg === undefined) return 'undefined'
    try {
      return JSON.stringify(arg)
    } catch {
      return String(arg)
    }
  }).join(' ')
}

/**
 * Получаем контекст запроса (userId, requestId, url)
 * Это асинхронная функция, поэтому вызывается отдельно
 */
export async function getRequestContext(): Promise<Pick<LogEntry, 'userId' | 'requestId' | 'url'>> {
  try {
    const { headers } = await import('next/headers')
    const { getCurrentUser } = await import('@/lib/auth/session')
    
    const headersList = await headers()
    const user = await getCurrentUser()
    
    return {
      userId: user?.id || undefined,
      requestId: headersList.get('x-request-id') || undefined,
      url: headersList.get('x-url') || headersList.get('referer') || undefined,
    }
  } catch {
    return {}
  }
}

/**
 * Инициализация перехвата console методов
 * Вызывается один раз при старте приложения
 */
export function initSystemLogger() {
  // Сохраняем оригинальные методы
  const originalLog = console.log
  const originalError = console.error
  const originalWarn = console.warn
  const originalInfo = console.info
  
  /**
   * Функция-перехватчик
   */
  function intercept(method: 'log' | 'error' | 'warn' | 'info', ...args: any[]) {
    // Сначала пишем в stdout (оригинальное поведение)
    switch (method) {
      case 'log': originalLog(...args); break
      case 'error': originalError(...args); break
      case 'warn': originalWarn(...args); break
      case 'info': originalInfo(...args); break
    }
    
    // Создаём запись для БД
    const entry: LogEntry = {
      level: getLevel(method),
      message: serializeArgs(args),
      stack: extractStack(args),
      source: extractSource(),
    }
    
    // Асинхронно пишем в БД (не блокируем)
    // getRequestContext вызывается отдельно для Server Actions
    // где есть доступ к headers()
    writeToDatabase(entry).catch(() => {})
  }
  
  // Перехватываем
  console.log = (...args: any[]) => intercept('log', ...args)
  console.error = (...args: any[]) => intercept('error', ...args)
  console.warn = (...args: any[]) => intercept('warn', ...args)
  console.info = (...args: any[]) => intercept('info', ...args)
}

/**
 * Записывает лог с контекстом запроса
 * Вызывается из API routes где есть объект Request
 */
export async function logWithRequestContext(
  method: 'log' | 'error' | 'warn' | 'info',
  req: Request,
  ...args: any[]
): Promise<void> {
  const entry: LogEntry = {
    level: getLevel(method),
    message: serializeArgs(args),
    stack: extractStack(args),
    source: extractSource(),
  }
  
  // Получаем контекст из запроса
  const headers = req.headers
  const forwarded = headers.get('x-forwarded-for')
  const ipAddress = forwarded ? forwarded.split(',')[0].trim() : headers.get('x-real-ip') || 'unknown'
  
  try {
    const { getCurrentUser } = await import('@/lib/auth/session')
    const user = await getCurrentUser()
    
    entry.userId = user?.id
    entry.requestId = headers.get('x-request-id') || undefined
    entry.url = req.url || undefined
  } catch {
    // Не критично если не удалось получить контекст
  }
  
  writeToDatabase(entry).catch(() => {})
}