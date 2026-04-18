import { NextResponse } from 'next/server'
import { removeSession, getSession } from '@/lib/auth/session'
import { headers } from 'next/headers'
import { logLogout } from '@/lib/actions/access-log'

export const runtime = 'nodejs'

export async function POST() {
  try {
    // Получаем текущую сессию перед удалением для логирования
    const session = await getSession()
    
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
    
    await removeSession()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}