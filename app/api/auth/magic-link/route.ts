import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createMagicLink } from '@/lib/auth/magic-link'
import { createHash } from 'crypto'
import { headers } from 'next/headers'
import { checkRateLimit, incrementLoginAttempt, verifySmartCaptcha } from '@/lib/auth/rate-limiter'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { email, userType, consentGiven, captchaToken } = await req.json()
    
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email обязателен' },
        { status: 400 }
      )
    }

    if (!userType || !['client', 'psychologist'].includes(userType)) {
      return NextResponse.json(
        { error: 'Неверный тип пользователя' },
        { status: 400 }
      )
    }

    // Проверяем лимит попыток
    const rateLimit = await checkRateLimit(email)
    
    // Если лимит превышен - требуем капчу
    if (rateLimit.isLimited || rateLimit.remainingAttempts <= 0) {
      if (!captchaToken) {
        return NextResponse.json(
          { 
            error: 'Превышено количество попыток. Требуется проверка капчи',
            requiresCaptcha: true
          },
          { status: 429 }
        )
      }
      
      // Проверяем капчу
      const captchaResult = await verifySmartCaptcha(captchaToken)
      if (!captchaResult.success) {
        return NextResponse.json(
          { 
            error: 'Неверная капча',
            requiresCaptcha: true
          },
          { status: 400 }
        )
      }
    }

    const normalizedEmail = email.toLowerCase().trim()
    const emailHash = createHash('sha256').update(normalizedEmail).digest('hex')
    
    // Получаем IP и User-Agent из заголовков
    const headersList = await headers()
    const forwarded = headersList.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : headersList.get('x-real-ip') || 'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'
    
    // Данные согласия для нового пользователя
    const consentData = consentGiven ? {
      consentGivenAt: new Date(),
      consentVersion: '1.0',
      consentIp: ip,
      consentUserAgent: userAgent
    } : {}
    
    if (userType === 'client') {
      // 1. Проверяем, есть ли клиент
      let client = await prisma.client.findUnique({
        where: { emailHash }
      })
      
      // 2. Если нет - создаем
      if (!client) {
        client = await prisma.client.create({
          data: {
            email: normalizedEmail,
            emailHash,
            ...consentData
          }
        })
        console.log(`📝 Новый клиент создан: ${normalizedEmail}`)
      }
    } else {
      // 1. Проверяем, есть ли психолог
      let user = await prisma.user.findUnique({
        where: { emailHash }
      })
      
      // 2. Если нет - создаем со статусом PENDING
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: normalizedEmail,
            emailHash,
            status: 'PENDING',
            isAdmin: false,
            isManager: false,
            certificationLevel: 0,
            ...consentData
          }
        })
        console.log(`📝 Новый пользователь создан: ${normalizedEmail} (PENDING)`)
      }
    }
    
    // 3. Увеличиваем счетчик попыток
    const attemptResult = await incrementLoginAttempt(email)
    
    // 4. Отправляем Magic Link с типом пользователя
    await createMagicLink(normalizedEmail, userType)
    
    // Всегда возвращаем успех (не раскрываем, существует пользователь или нет)
    return NextResponse.json({ 
      message: 'Ссылка для входа отправлена на указанный email',
      remainingAttempts: attemptResult.remainingAttempts,
      requiresCaptcha: attemptResult.isLimited
    })
    
  } catch (error) {
    console.error('Magic link error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}