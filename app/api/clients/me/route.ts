import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

/**
 * GET /api/clients/me - Получение данных текущего клиента
 * Использует сессию для аутентификации (защита от IDOR)
 */
export async function GET(request: NextRequest) {
  try {
    // ПРОВЕРКА 1: Получаем сессию пользователя
    const session = await getSession();
    
    if (!session || !session.clientId) {
      // Если нет сессии клиента, возвращаем пустой ответ
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    // ПРОВЕРКА 2: Получаем данные клиента из БД по ID из сессии
    // Это защищает от IDOR - нельзя подделать clientId через заголовок
    const client = await prisma.client.findUnique({
      where: { id: session.clientId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        vk: true,
      },
    });

    if (!client) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    return NextResponse.json({
      success: true,
      data: client,
    });
  } catch (error) {
    console.error("Error in GET /api/clients/me:", error);
    return NextResponse.json(
      { success: false, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
