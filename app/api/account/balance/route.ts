import { getCurrentUser } from '@/lib/auth/session';
import { getBalance } from '@/lib/billing';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const balance = await getBalance(user.id);

    return NextResponse.json({ balance });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Ошибка при получении баланса' },
      { status: 500 }
    );
  }
}