import { NextRequest, NextResponse } from "next/server";
import { getLeadById } from "@/lib/actions/leads";
import { getCurrentUser } from "@/lib/auth/session";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/leads/[id] - Получение детальной информации о заявке
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Получаем текущего пользователя
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Требуется авторизация" },
        { status: 401 }
      );
    }

    const result = await getLeadById(id, user.id);

    if (result.success && result.lead) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, error: result.error || "Заявка не найдена" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error in GET /api/leads/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
