import { getCurrentUser } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || String(DEFAULT_PAGE));
    const limit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT));
    const email = searchParams.get('email') || '';
    const type = searchParams.get('type') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    const skip = (page - 1) * limit;

    // Фильтры
    const where: any = {};

    // Фильтр по email пользователя
    if (email) {
      const emailUser = await prisma.user.findFirst({
        where: { email: { contains: email, mode: 'insensitive' } },
        select: { id: true },
      });
      if (emailUser) {
        where.userId = emailUser.id;
      } else {
        // Если пользователь не найден, возвращаем пустой результат
        return NextResponse.json({
          items: [],
          total: 0,
          page,
          limit,
          hasMore: false,
        });
      }
    }

    // Фильтр по типу операции
    if (type) {
      where.type = type;
    }

    // Фильтр по дате
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Добавляем конец дня
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      hasMore: skip + items.length < total,
    });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: error.message || 'Ошибка при получении транзакций' },
      { status: 500 }
    );
  }
}