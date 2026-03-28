import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSession, setSessionCookie } from '@/lib/auth/session'
import { createHash } from 'crypto'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    const email = searchParams.get('email')
    
    if (!token || !email) {
      return NextResponse.redirect(new URL('/auth/login?error=invalid', req.url))
    }

    const normalizedEmail = email.toLowerCase().trim()
    
    // 1. Ищем токен верификации
    const verification = await prisma.verificationToken.findFirst({
      where: {
        identifier: normalizedEmail,
        token,
        expires: { gt: new Date() }
      }
    })
    
    if (!verification) {
      return NextResponse.redirect(
        new URL('/auth/login?error=expired', req.url)
      )
    }
    
    // 2. Удаляем использованный токен
    await prisma.verificationToken.delete({
      where: { token: verification.token }
    })
    
    // 3. Ищем пользователя
    const emailHash = createHash('sha256').update(normalizedEmail).digest('hex')
    
    let user = await prisma.user.findUnique({
      where: { emailHash }
    })
    
    if (!user) {
      // Такого не должно быть, но на всякий случай
      return NextResponse.redirect(
        new URL('/auth/login?error=user_not_found', req.url)
      )
    }
    
    // 4. Обновляем статус пользователя
    const wasPending = user.status === 'PENDING'
    
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: user.emailVerified || new Date(), // Если не было - ставим
        status: wasPending ? 'CANDIDATE' : user.status // Если был PENDING -> CANDIDATE
      }
    })
    
    // 5. Создаем сессию
    const session = await createSession(user.id)
    await setSessionCookie(session.sessionToken, session.expires)
    
    // 6. Редиректим по ролям
    if (user.isAdmin || user.isManager) {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
    
    return NextResponse.redirect(new URL('/account', req.url))
    
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.redirect(
      new URL('/auth/login?error=server_error', req.url)
    )
  }
}