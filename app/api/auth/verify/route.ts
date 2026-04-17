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
        return NextResponse.redirect(
          new URL('/auth/login?error=user_not_found', req.url)
        )
      }
      
      // Обновляем emailVerified
      await prisma.client.update({
        where: { id: client.id },
        data: {
          emailVerified: client.emailVerified || new Date()
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
      
      // Редирект в ЛК клиента
      return NextResponse.redirect(new URL('/client/account', req.url))
    } else {
      // Ищем психолога
      let user = await prisma.user.findUnique({
        where: { emailHash }
      })
      
      if (!user) {
        return NextResponse.redirect(
          new URL('/auth/login?error=user_not_found', req.url)
        )
      }
      
      // Обновляем статус пользователя
      const wasPending = user.status === 'PENDING'
      
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: user.emailVerified || new Date(),
          status: wasPending ? 'CANDIDATE' : user.status
        }
      })
      
      // Создаем сессию для психолога
      const session = await createSession(user.id)
      await setSessionCookie(session.sessionToken, session.expires)
      
      // 5. Редирект по ролям
      if (user.isAdmin || user.isManager) {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
      
      return NextResponse.redirect(new URL('/account', req.url))
    }
    
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.redirect(
      new URL('/auth/login?error=server_error', req.url)
    )
  }
}