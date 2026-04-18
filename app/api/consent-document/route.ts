import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// GET - получение активной версии политики
export async function GET() {
  try {
    const document = await prisma.consentDocument.findFirst({
      where: { isActive: true }
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Политика не найдена' },
        { status: 404 }
      )
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error('Error fetching consent document:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}