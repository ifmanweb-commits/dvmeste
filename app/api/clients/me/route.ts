import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/clients/me - Получение данных текущего клиента
 * Читает clientId из заголовка X-Client-Id
 */
export async function GET(request: NextRequest) {
  try {
    const clientId = request.headers.get("X-Client-Id");

    if (!clientId) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
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