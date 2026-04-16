import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

export async function PUT(req: Request) {
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
    
    // @ts-ignore - clientId существует в схеме
    if (!session || session.expires < new Date() || !session.clientId) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    const body = await req.json()
    const { name, phone, vk } = body
    
    // Обновляем профиль клиента
    const clientId = (session as any).clientId
    await prisma.client.update({
      where: { id: clientId },
      data: {
        name: name || null,
        phone: phone || null,
        vk: vk || null
      }
    })
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Client profile update error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}