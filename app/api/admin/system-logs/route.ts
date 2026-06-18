import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/require'

export const runtime = 'nodejs'

/**
 * GET /api/admin/system-logs
 * Получение системных логов с фильтрацией и пагинацией
 * Доступ: только админы (isAdmin: true)
 */
export async function GET(req: Request) {
  try {
    const admin = await requireAdmin()
    
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '100', 10)
    const level = searchParams.get('level') || undefined
    const source = searchParams.get('source') || undefined
    const search = searchParams.get('search') || undefined
    const dateFrom = searchParams.get('dateFrom') || undefined
    const dateTo = searchParams.get('dateTo') || undefined
    
    const skip = (page - 1) * limit
    
    // Формируем фильтры
    const where: any = {}
    
    if (level) {
      where.level = level
    }
    
    if (source) {
      where.source = { contains: source, mode: 'insensitive' }
    }
    
    if (search) {
      where.OR = [
        { message: { contains: search, mode: 'insensitive' } },
        { stack: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    if (dateFrom) {
      where.createdAt = { ...where.createdAt, gte: new Date(dateFrom) }
    }
    
    if (dateTo) {
      where.createdAt = { ...where.createdAt, lte: new Date(dateTo) }
    }
    
    // Получаем логи и общее количество
    const [logs, total] = await Promise.all([
      prisma.systemLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.systemLog.count({ where }),
    ])
    
    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Error fetching system logs:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка при получении логов' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/system-logs
 * Очистка старых логов
 * Доступ: только админы (isAdmin: true)
 */
export async function DELETE(req: Request) {
  try {
    const admin = await requireAdmin()
    
    const { olderThan } = await req.json()
    
    if (!olderThan) {
      return NextResponse.json(
        { success: false, error: 'Укажите дату (olderThan)' },
        { status: 400 }
      )
    }
    
    const cutoffDate = new Date(olderThan)
    
    const result = await prisma.systemLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    })
    
    return NextResponse.json({
      success: true,
      data: {
        deleted: result.count,
        message: `Удалено ${result.count} записей старше ${olderThan}`,
      },
    })
  } catch (error) {
    console.error('Error cleaning up system logs:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка при очистке логов' },
      { status: 500 }
    )
  }
}