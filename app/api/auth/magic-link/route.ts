import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createMagicLink } from '@/lib/auth/magic-link'
import { createHash } from 'crypto'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { email, userType } = await req.json()
    
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

    const normalizedEmail = email.toLowerCase().trim()
    const emailHash = createHash('sha256').update(normalizedEmail).digest('hex')
    
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
            emailHash
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
            certificationLevel: 0
          }
        })
        console.log(`📝 Новый пользователь создан: ${normalizedEmail} (PENDING)`)
      }
    }
    
    // 3. Отправляем Magic Link с типом пользователя
    await createMagicLink(normalizedEmail, userType)
    
    // Всегда возвращаем успех (не раскрываем, существует пользователь или нет)
    return NextResponse.json({ 
      message: 'Ссылка для входа отправлена на указанный email' 
    })
    
  } catch (error) {
    console.error('Magic link error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}