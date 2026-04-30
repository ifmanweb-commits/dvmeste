import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSession, setSessionCookie } from '@/lib/auth/session'
import { createHash } from 'crypto'
import { headers } from 'next/headers'
import { logLoginSuccess, logLoginFailed } from '@/lib/actions/access-log'
import { resetLoginAttempts } from '@/lib/auth/rate-limiter'

export const runtime = 'nodejs'

// Базовый URL для редиректов
function getBaseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL 
    || process.env.NEXTAUTH_URL 
    || 'https://dvmeste.ru'
}

export async function GET(req: Request) {
  try {
    const baseUrl = getBaseUrl()
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    const email = searchParams.get('email')
    
    if (!token || !email) {
      return NextResponse.redirect(new URL('/auth/login?error=invalid', baseUrl))
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
        new URL('/auth/login?error=expired', baseUrl)
      )
    }
    
    // 2. Получаем userType из metadata
    let userType: 'client' | 'psychologist' = 'psychologist'
    if (verification.metadata) {
      try {
        const metadata = JSON.parse(verification.metadata)
        userType = metadata.userType || 'psychologist'
      } catch {
        // Если metadata не распарсился, используем psychologist по умолчанию
      }
    }
    
    // 3. Удаляем использованный токен
    await prisma.verificationToken.delete({
      where: { token: verification.token }
    })
    
    // 4. В зависимости от типа пользователя ищем в нужной таблице
    const emailHash = createHash('sha256').update(normalizedEmail).digest('hex')
    
    if (userType === 'client') {
      // Ищем клиента
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
          new URL('/auth/login?error=user_not_found', baseUrl)
        )
      }
      
      // Обновляем emailVerified и заполняем согласие если его нет
      const consentData = !client.consentGivenAt ? {
        consentGivenAt: new Date(),
        consentVersion: '1.0',
        consentIp: ip,
        consentUserAgent: userAgent
      } : {}
      
      await prisma.client.update({
        where: { id: client.id },
        data: {
          emailVerified: client.emailVerified || new Date(),
          ...consentData
        }
      })
      
      // Создаем сессию для клиента
      const session = await prisma.session.create({
        data: {
          sessionToken: require('crypto').randomBytes(32).toString('hex'),
          clientId: client.id,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 дней
        }
      })
      
      await setSessionCookie(session.sessionToken, session.expires)
      
      // Логирование успешного входа
      await logLoginSuccess({
        sessionId: session.sessionToken,
        clientId: client.id,
        userType: 'client',
        ipAddress: ip,
        userAgent: userAgent || undefined,
        email: normalizedEmail
      })
      
      // Сбрасываем счетчик попыток входа
      await resetLoginAttempts(normalizedEmail)
      
      // Редирект в ЛК клиента
      return NextResponse.redirect(new URL('/client/account', baseUrl))
    } else {
      // Ищем психолога
      let user = await prisma.user.findUnique({
        where: { emailHash }
      })
      
      if (!user) {
        // Логирование неудачного входа - пользователь не найден
        await logLoginFailed({
          email: normalizedEmail,
          reason: 'user_not_found',
          ipAddress: ip,
          userAgent: userAgent || undefined
        })
        
        return NextResponse.redirect(
          new URL('/auth/login?error=user_not_found', baseUrl)
        )
      }
      
      // Обновляем статус пользователя и заполняем согласие если его нет
      const wasPending = user.status === 'PENDING'
      
      const consentData = !user.consentGivenAt ? {
        consentGivenAt: new Date(),
        consentVersion: '1.0',
        consentIp: ip,
        consentUserAgent: userAgent
      } : {}
      
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: user.emailVerified || new Date(),
          status: wasPending ? 'CANDIDATE' : user.status,
          ...consentData
        }
      })
      
      // Создаем сессию для психолога
      const session = await createSession(user.id)
      await setSessionCookie(session.sessionToken, session.expires)
      
      // Логирование успешного входа
      await logLoginSuccess({
        sessionId: session.sessionToken,
        userId: user.id,
        userType: 'psychologist',
        ipAddress: ip,
        userAgent: userAgent || undefined,
        email: normalizedEmail
      })
      
      // Сбрасываем счетчик попыток входа
      await resetLoginAttempts(normalizedEmail)
      
      // 5. Редирект по ролям
      if (user.isAdmin || user.isManager) {
        return NextResponse.redirect(new URL('/admin', baseUrl))
      }

      return NextResponse.redirect(new URL('/account', baseUrl))
    }
    
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.redirect(
      new URL('/auth/login?error=server_error', getBaseUrl())
    )
  }
}
