import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value
    
    if (sessionToken) {
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