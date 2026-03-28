import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCookie } from "@/lib/utils/cookies";

/**
 * GET /api/clients/me - Получение данных текущего клиента
 * Читает clientId из куки и возвращает данные клиента
 */
export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const clientId = getCookie(cookieHeader, "clientId");

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
        telegram: true,
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