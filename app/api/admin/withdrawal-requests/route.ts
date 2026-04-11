import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const status = searchParams.get('status') || undefined;
    const tab = searchParams.get('tab') || 'pending'; // 'pending' или 'history'

    const skip = (page - 1) * limit;

    const where: any = {};

    if (tab === 'pending') {
      where.status = 'PENDING';
    } else if (tab === 'history') {
      where.status = { in: ['APPROVED', 'REJECTED'] };
    } else if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      prisma.withdrawalRequest.findMany({
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
          moderator: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
      }),
      prisma.withdrawalRequest.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      hasMore: skip + items.length < total,
    });
  } catch (error: any) {
    console.error('Error fetching withdrawal requests:', error);
    return NextResponse.json(
      { error: error.message || 'Ошибка при получении заявок' },
      { status: 500 }
    );
  }
}