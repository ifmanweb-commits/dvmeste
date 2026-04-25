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
    
    const url = new URL(request.url)
    
    // Исключения для webhook-ов (Tinkoff и другие внешние сервисы)
    if (url.pathname.startsWith('/api/payments/webhook')) {
      return response
    }
    
    // Исключения для API файлов (там своя проверка авторизации)
    if (url.pathname.startsWith('/api/files')) {
      return response
    }
    
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
