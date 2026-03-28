import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createMagicLink } from '@/lib/auth/magic-link'
import { createHash } from 'crypto'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email обязателен' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()
    
    // 1. Проверяем, есть ли пользователь
    const emailHash = createHash('sha256').update(normalizedEmail).digest('hex')
    
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
    
    // 3. Отправляем Magic Link (всегда, даже если пользователь уже есть)
    await createMagicLink(normalizedEmail)
    
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