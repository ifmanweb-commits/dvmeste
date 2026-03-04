import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/session'

export const runtime = 'nodejs'

// PUT /api/account/profile - обновление профиля
export async function PUT(req: Request) {
  try {
    // Получаем текущего пользователя
    const user = await getCurrentUser()
    
    if (!user?.id) {
      return NextResponse.json(
        { error: "Не авторизован" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { fullName, price, contactInfo } = body

    // Обновляем пользователя в БД
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        fullName,
        price: price ? parseInt(price) : null,
        contactInfo,
      },
    })

    return NextResponse.json({ 
      success: true, 
      user: updatedUser 
    })
    
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    )
  }
}