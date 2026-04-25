import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/require';

export async function GET() {
  try {
    // ПРОВЕРКА: Только админы могут получать список ключей
    await requireAdmin();
    
    const keys = await prisma.key.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ keys });
  } catch (error) {
    console.error('Error fetching keys:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
