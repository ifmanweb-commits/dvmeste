import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function normalizeRole(role: unknown): 'ADMIN' | 'MANAGER' {
  return String(role || 'MANAGER').toUpperCase() === 'ADMIN' ? 'ADMIN' : 'MANAGER';
}

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('auth-session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Нет сессии' }, { status: 401 });
    }
    const sessionData = JSON.parse(sessionCookie.value);
                                           
    const manager = await prisma.manager.findUnique({
      where: { id: sessionData.id },
    });
    if (!manager) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 401 });
    }
                                                     
    const newSessionData = {
      ...sessionData,
      role: normalizeRole(manager.role),
      permissions: manager.permissions || {},
      isActive: manager.isActive,
    };
    const response = NextResponse.json({ success: true });
    response.cookies.set('auth-session', JSON.stringify(newSessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,           
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('Session refresh error:', error);
    return NextResponse.json({ error: 'Ошибка обновления сессии' }, { status: 500 });
  }
}
