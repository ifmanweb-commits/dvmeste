import { NextRequest, NextResponse } from "next/server"
import { getActiveTipsForPage } from "@/lib/actions/onboarding"
import { normalizeUrl } from "@/lib/utils"

/**
 * GET /api/onboarding?url=<current_url>
 * 
 * Возвращает активные подсказки для текущей страницы,
 * исключая те, которые пользователь уже закрыл.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const pageUrl = searchParams.get("url")

    if (!pageUrl) {
      return NextResponse.json(
        { error: "URL параметр обязателен" },
        { status: 400 }
      )
    }

    // Нормализуем URL для сравнения
    const normalizedUrl = normalizeUrl(pageUrl)

    const result = await getActiveTipsForPage(normalizedUrl)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error("Error in onboarding API:", error)
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    )
  }
}