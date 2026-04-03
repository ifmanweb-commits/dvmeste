import { getCurrentUser } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';
import { manualAdjustment } from '@/lib/billing';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, amount, description } = body;

    if (!userId || amount === undefined || !description) {
      return NextResponse.json(
        { error: 'userId, amount и description обязательны' },
        { status: 400 }
      );
    }

    // amount приходит в рублях, конвертируем в копейки
    const amountInKopecks = Math.round(amount * 100);

    const result = await manualAdjustment(userId, amountInKopecks, description);

    if (result.success) {
      return NextResponse.json({
        success: true,
        newBalance: result.newBalance,
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Ошибка при корректировке баланса' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error adjusting balance:', error);
    return NextResponse.json(
      { error: error.message || 'Ошибка при корректировке баланса' },
      { status: 500 }
    );
  }
}