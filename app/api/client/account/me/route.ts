import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    // Ищем сессию
    const session = await prisma.session.findUnique({
      where: { sessionToken }
    })
    
    if (!session || session.expires < new Date()) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    // Если это сессия клиента - загружаем клиента
    // @ts-ignore - clientId существует в схеме, но не в кэше TypeScript
    if (session.clientId) {
      const client = await prisma.client.findUnique({
        // @ts-ignore
        where: { id: session.clientId }
      })
      
      if (!client) {
        return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
      }
      
      // Возвращаем данные клиента без чувствительных полей
      const { email, id, name, phone, vk } = client
      
      return NextResponse.json({
        id,
        email,
        name,
        phone,
        vk
      })
    }
    
    return NextResponse.json({ error: 'Это не клиентская сессия' }, { status: 401 })
    
  } catch (error) {
    console.error('Client account me error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
