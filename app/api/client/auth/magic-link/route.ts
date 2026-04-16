import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createMagicLinkForClient } from '@/lib/auth/client-magic-link'
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
    
    // 1. Проверяем, есть ли клиент
    const emailHash = createHash('sha256').update(normalizedEmail).digest('hex')
    
    let client = await prisma.client.findUnique({
      where: { emailHash }
    })
    
    // 2. Если нет - создаем
    if (!client) {
      client = await prisma.client.create({
        data: {
          email: normalizedEmail,
          emailHash,
        }
      })
      console.log(`📝 Новый клиент создан: ${normalizedEmail}`)
    }
    
    // 3. Отправляем Magic Link (всегда, даже если клиент уже есть)
    await createMagicLinkForClient(normalizedEmail)
    
    // Всегда возвращаем успех (не раскрываем, существует клиент или нет)
    return NextResponse.json({ 
      message: 'Ссылка для входа отправлена на указанный email' 
    })
    
  } catch (error) {
    console.error('Client magic link error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}