import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { headers } from 'next/headers'
import { logLogout } from '@/lib/actions/access-log'

export const runtime = 'nodejs'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value
    
    // Получаем IP и User-Agent из заголовков
    const headersList = await headers()
    const forwarded = headersList.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : headersList.get('x-real-ip') || 'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'
    
    if (sessionToken) {
      // Получаем сессию для логирования перед удалением
      const session = await prisma.session.findUnique({
        where: { sessionToken }
      })
      
      // Логирование выхода
      if (session) {
        await logLogout({
          sessionId: session.sessionToken,
          clientId: session.clientId || undefined,
          userType: 'client',
          ipAddress: ip,
          userAgent: userAgent || undefined
        })
      }
      
      // Удаляем сессию из базы
      await prisma.session.deleteMany({
        where: { sessionToken }
      })
      
      // Удаляем куки
      cookieStore.set('session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(0),
        path: '/'
      })
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}