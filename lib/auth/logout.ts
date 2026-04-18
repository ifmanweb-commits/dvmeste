'use server';

import { removeSession, getSession } from './session';
import { redirect } from 'next/navigation';
import { logLogout } from '@/lib/actions/access-log';
import { headers } from 'next/headers';

export async function logout() {
  console.log('🚪 Logout started');
  
  // Получаем сессию перед удалением для логирования
  const session = await getSession();
  
  // Получаем IP и User-Agent из заголовков
  const headersList = await headers()
  const forwarded = headersList.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : headersList.get('x-real-ip') || 'unknown'
  const userAgent = headersList.get('user-agent') || 'unknown'
  
  // Логирование выхода
  if (session) {
    await logLogout({
      sessionId: session.sessionToken,
      userId: session.userId || undefined,
      clientId: session.clientId || undefined,
      userType: session.userId ? 'psychologist' : 'client',
      ipAddress: ip,
      userAgent: userAgent || undefined
    })
  }
  
  // Используем существующий метод removeSession
  await removeSession();
  
  console.log('🔄 Redirecting to login');
  redirect('/auth/login');
}
