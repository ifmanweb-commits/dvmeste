import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ⚠️ ВАЖНО: Здесь НЕЛЬЗЯ импортировать prisma напрямую
// Вместо этого делаем запрос к внутреннему API или проверяем сессию через cookies

export async function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get('session')?.value
  const path = request.nextUrl.pathname

  // Публичные маршруты
  if (path.startsWith('/auth') || path === '/' || path.startsWith('/catalog')) {
    return NextResponse.next()
  }

  // Для защищенных маршрутов проверяем сессию через API (не через прямой запрос к БД)
  if (path.startsWith('/account') || path.startsWith('/admin')) {
    // Если нет токена - сразу редирект
    if (!sessionToken) {
      const url = new URL('/auth/login', request.url)
      url.searchParams.set('callbackUrl', path)
      return NextResponse.redirect(url)
    }

    // Опционально: можно сделать fetch запрос к API для проверки валидности сессии
    // Но для простоты можно пропустить и положиться на проверку в layout
  }

  return NextResponse.next()
}