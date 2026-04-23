import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { headers } from 'next/headers'
import { createHash } from 'crypto'
import { logLoginSuccess, logLoginFailed } from '@/lib/actions/access-log'

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
    
    // Получаем IP и User-Agent из заголовков
    const headersList = await headers()
    const forwarded = headersList.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : headersList.get('x-real-ip') || 'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'
    
    // 1. Ищем токен верификации
    const verification = await prisma.verificationToken.findFirst({
      where: {
        identifier: normalizedEmail,
        token,
        expires: { gt: new Date() }
      }
    })
    
    if (!verification) {
      // Логирование неудачного входа - истёкший токен
      await logLoginFailed({
        email: normalizedEmail,
        reason: 'expired_token',
        ipAddress: ip,
        userAgent: userAgent || undefined
      })
      
      return NextResponse.redirect(
        new URL('/auth/login?error=expired', req.url)
      )
    }
    
    // 2. Удаляем использованный токен
    await prisma.verificationToken.delete({
      where: { token: verification.token }
    })
    
    // 3. Ищем клиента
    const emailHash = createHash('sha256').update(normalizedEmail).digest('hex')
    
    let client = await prisma.client.findUnique({
      where: { emailHash }
    })
    
    if (!client) {
      // Логирование неудачного входа - пользователь не найден
      await logLoginFailed({
        email: normalizedEmail,
        reason: 'user_not_found',
        ipAddress: ip,
        userAgent: userAgent || undefined
      })
      
      return NextResponse.redirect(
        new URL('/auth/login?error=client_not_found', req.url)
      )
    }
    
    // 4. Обновляем статус клиента - ставим emailVerified и заполняем согласие если его нет
    const consentData = !client.consentGivenAt ? {
      consentGivenAt: new Date(),
      consentVersion: '1.0',
      consentIp: ip,
      consentUserAgent: userAgent
    } : {}
    
    await prisma.client.update({
      where: { id: client.id },
      data: {
        emailVerified: new Date(),
        ...consentData
      }
    })
    
    // 5. Создаем сессию для клиента
    const session = await createSessionForClient(client.id)
    
    // 6. Устанавливаем куки сессии
    const cookieStore = await cookies()
    cookieStore.set('session', session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: session.expires,
      path: '/'
    })
    
    // 7. Логирование успешного входа
    await logLoginSuccess({
      sessionId: session.sessionToken,
      clientId: client.id,
      userType: 'client',
      ipAddress: ip,
      userAgent: userAgent || undefined,
      email: normalizedEmail
    })
    
    // 8. Редирект в личный кабинет клиента
    return NextResponse.redirect(new URL('/client/account', req.url))
    
  } catch (error) {
    console.error('Client verify error:', error)
    return NextResponse.redirect(
      new URL('/auth/login?error=server_error', req.url)
    )
  }
}

// Создаем сессию для клиента
async function createSessionForClient(clientId: string) {
  const { randomBytes } = await import('crypto')
  
  const sessionToken = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 дней
  
  const session = await prisma.session.create({
    data: {
      sessionToken,
      clientId: clientId,
      expires
    }
  })
  
  return session
}