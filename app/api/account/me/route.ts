import { getCurrentUser } from '@/lib/auth/session';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        isSupervisor: user.isSupervisor,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Ошибка при получении данных пользователя' },
      { status: 500 }
    );
  }
}