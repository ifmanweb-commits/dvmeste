import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

/**
 * POST /api/client/account/leads - Создание заявки от авторизованного клиента
 */
export async function POST(request: NextRequest) {
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
    
    // Получаем clientId из сессии
    const clientId = (session as any).clientId
    
    if (!clientId) {
      return NextResponse.json({ error: 'Это не клиентская сессия' }, { status: 401 })
    }
    
    const body = await request.json()
    const { psychologistId, message, honeypot, formOpenTime } = body
    
    // Проверка honeypot (защита от ботов)
    if (honeypot && honeypot.trim() !== '') {
      return NextResponse.json(
        { success: false, error: "Обнаружена подозрительная активность" },
        { status: 400 }
      )
    }

    // Проверка времени заполнения формы (минимум 3 секунды)
    if (formOpenTime) {
      const openTime = new Date(formOpenTime).getTime()
      const submitTime = Date.now()
      const timeDiff = submitTime - openTime
      
      if (timeDiff < 3000) {
        return NextResponse.json(
          { success: false, error: "Слишком быстрая отправка формы" },
          { status: 400 }
        )
      }
    }
    
    if (!psychologistId || !message) {
      return NextResponse.json(
        { success: false, error: "Не все обязательные поля заполнены" },
        { status: 400 }
      )
    }

    // Создаём заявку
    const lead = await prisma.lead.create({
      data: {
        psychologistId,
        clientId,
        message,
        status: 'NEW'
      }
    })
    
    return NextResponse.json({ 
      success: true, 
      leadId: lead.id
    })
    
  } catch (error) {
    console.error('Client leads POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/client/account/leads - Получение списка заявок клиента
 */
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
    
    // Получаем clientId из сессии
    const clientId = (session as any).clientId
    
    if (!clientId) {
      return NextResponse.json({ error: 'Это не клиентская сессия' }, { status: 401 })
    }
    
    // Загружаем заявки клиента
    const leads = await prisma.lead.findMany({
      where: { clientId },
      include: {
        psychologist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            slug: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Форматируем результат
    const formattedLeads = leads.map(lead => ({
      id: lead.id,
      createdAt: lead.createdAt.toISOString(),
      message: lead.message,
      psychologist: {
        id: lead.psychologist.id,
        name: `${lead.psychologist.lastName || ''} ${lead.psychologist.firstName || ''}`.trim() || 'Психолог',
        slug: lead.psychologist.slug,
        photo: lead.psychologist.avatarUrl
      }
    }))
    
    return NextResponse.json(formattedLeads)
    
  } catch (error) {
    console.error('Client leads error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}