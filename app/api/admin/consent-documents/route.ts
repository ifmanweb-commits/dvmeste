import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// GET - получение списка всех версий политик
export async function GET() {
  try {
    const documents = await prisma.consentDocument.findMany({
      orderBy: [
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error('Error fetching consent documents:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// POST - создание новой версии политики
export async function POST(req: Request) {
  try {
    const { version, documentUrl, content, validFrom } = await req.json()

    // Валидация обязательных полей
    if (!version || typeof version !== 'string') {
      return NextResponse.json(
        { error: 'Версия обязательна' },
        { status: 400 }
      )
    }

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Текст политики обязателен' },
        { status: 400 }
      )
    }

    // Валидация формата версии (major.minor)
    const versionRegex = /^\d+\.\d+$/
    if (!versionRegex.test(version)) {
      return NextResponse.json(
        { error: 'Версия должна быть в формате X.Y (например, 1.0, 2.1)' },
        { status: 400 }
      )
    }

    // Получаем последнюю версию для проверки
    const latestDocument = await prisma.consentDocument.findFirst({
      orderBy: { createdAt: 'desc' }
    })

    if (latestDocument) {
      // Проверка на дубликат версии
      const existingVersion = await prisma.consentDocument.findFirst({
        where: { version }
      })

      if (existingVersion) {
        return NextResponse.json(
          { error: 'Версия с таким номером уже существует' },
          { status: 400 }
        )
      }

      // Парсим версии для сравнения
      const [latestMajor, latestMinor] = latestDocument.version.split('.').map(Number)
      const [newMajor, newMinor] = version.split('.').map(Number)

      // Проверка, что новая версия не меньше последней
      if (newMajor < latestMajor || (newMajor === latestMajor && newMinor <= latestMinor)) {
        return NextResponse.json(
          { error: `Новая версия должна быть больше текущей (${latestDocument.version})` },
          { status: 400 }
        )
      }
    }

    // Создаем новую политику в транзакции
    const result = await prisma.$transaction(async (tx) => {
      // Деактивируем все предыдущие версии
      await tx.consentDocument.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      })

      // Создаем новую активную версию
      const newDocument = await tx.consentDocument.create({
        data: {
          version,
          documentUrl: documentUrl || null,
          content,
          validFrom: validFrom ? new Date(validFrom) : new Date(),
          isActive: true
        }
      })

      return newDocument
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating consent document:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}