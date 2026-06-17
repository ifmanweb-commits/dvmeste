import { NextRequest, NextResponse } from 'next/server'
import { verifyCsrfToken, generateCsrfToken } from '@/lib/csrf'

/**
 * Proxy функция для обработки запросов (вместо middleware)
 * Устанавливает CSRF токен и проверяет для mutating операций
 */
export function proxy(request: NextRequest) {
  const response = NextResponse.next()
  const method = request.method
  
  // Генерируем токен если нет
  if (!request.cookies.has('csrf_token')) {
    const token = generateCsrfToken()
    response.cookies.set('csrf_token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/'
    })
  }
  
  // Только для mutating методов
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = request.headers.get('X-CSRF-Token')
    const cookieToken = request.cookies.get('csrf_token')?.value
    
    // Проверяем CSRF токен
    if (!verifyCsrfToken(csrfToken, cookieToken)) {
      return NextResponse.json(
        { error: 'CSRF token missing or invalid' },
        { status: 403 }
      )
    }
  }
  
  return response
}

/**
 * Конфигурация matcher для proxy
 * Исключаем:
 * - _next/static (статические файлы Next.js)
 * - _next/image (оптимизация изображений)
 * - favicon.ico, sitemap.xml, robots.txt (метаданные)
 * - api/payments/webhook (Tinkoff webhook)
 * - api/files (загрузка файлов - своя авторизация)
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/payments/webhook|api/files).*)',
  ],
}