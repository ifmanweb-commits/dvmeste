import { NextRequest, NextResponse } from "next/server";
import { createComplaint, getComplaintsForAdmin } from "@/lib/actions/complaints";
import { getCurrentUser } from "@/lib/auth/session";

/**
 * POST /api/complaints - Создание жалобы
 */
export async function POST(request: NextRequest) {
  try {
    // Получаем текущего пользователя
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Требуется авторизация" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fromType, toType, toId, reason, description, leadId } = body;

    // fromId берётся из сессии текущего пользователя
    const fromId = user.id;

    if (!fromType || !toType || !toId || !reason) {
      return NextResponse.json(
        { success: false, error: "Не все обязательные поля заполнены" },
        { status: 400 }
      );
    }

    const result = await createComplaint({
      fromType,
      fromId,
      toType,
      toId,
      reason,
      description,
      leadId,
    });

    if (result.success) {
      return NextResponse.json({ success: true, complaintId: result.complaintId });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in POST /api/complaints:", error);
    return NextResponse.json(
      { success: false, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/complaints - Получение списка жалоб для админки
 * Query params: page, limit, resolved, fromType, toType
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 20;
    const resolved = searchParams.get("resolved");
    const fromType = searchParams.get("fromType") || undefined;
    const toType = searchParams.get("toType") || undefined;

    const result = await getComplaintsForAdmin({
      page,
      limit,
      resolved: resolved === "true",
      fromType,
      toType,
    });

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in GET /api/complaints:", error);
    return NextResponse.json(
      { success: false, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}