import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/session'
import { createHash } from 'crypto'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    // Проверка прав администратора
    const user = await getCurrentUser()
    if (!user || (!user.isAdmin && !user.isManager)) {
      return NextResponse.json(
        { error: 'Доступ запрещён' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 100
    const skip = (page - 1) * limit

    // Фильтры
    const eventType = searchParams.get('eventType') || undefined
    const email = searchParams.get('email') || undefined
    const userId = searchParams.get('userId') || undefined
    const ipAddress = searchParams.get('ipAddress') || undefined
    const dateFrom = searchParams.get('dateFrom') || undefined
    const dateTo = searchParams.get('dateTo') || undefined

    // Формируем where условие
    const where: any = {}

    if (eventType) {
      where.eventType = eventType
    }

    if (email) {
      // Хешируем email для поиска
      where.emailHash = createHash('sha256').update(email.toLowerCase().trim()).digest('hex')
    }

    if (userId) {
      // Поиск по ID пользователя или клиента
      where.OR = [
        { userId: userId },
        { clientId: userId }
      ]
    }

    if (ipAddress) {
      where.ipAddress = ipAddress
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        // Добавляем конец дня для dateTo
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999)
        where.createdAt.lte = toDate
      }
    }

    // Получаем общее количество записей
    const total = await prisma.accessLog.count({ where })

    // Получаем записи с пагинацией
    const logs = await prisma.accessLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          }
        },
        client: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        }
      }
    })

    // Форматируем результат
    const formattedLogs = logs.map(log => ({
      id: log.id,
      sessionId: log.sessionId,
      eventType: log.eventType,
      userType: log.userType,
      userId: log.userId,
      clientId: log.clientId,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      reason: log.reason,
      createdAt: log.createdAt,
      // Данные пользователя или клиента
      userEmail: log.user?.email || log.client?.email || null,
      userName: log.user?.fullName || log.client?.name || null,
    }))

    return NextResponse.json({
      logs: formattedLogs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Error fetching access logs:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}