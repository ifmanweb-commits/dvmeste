import { NextRequest, NextResponse } from "next/server";
import { updateLeadStatus } from "@/lib/actions/leads";
import { getCurrentUser } from "@/lib/auth/session";
import { LeadStatus } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Список допустимых статусов
const VALID_STATUSES = [
  "NEW",
  "ACCEPTED",
  "REJECTED",
  "CONTACTED",
  "APPOINTMENT",
  "FREE_SESSION",
  "PAID_SESSION",
  "NO_CONTACT",
  "CLIENT_REJECTED",
  "ARCHIVED",
] as const;

/**
 * PATCH /api/leads/[id]/status - Обновление статуса заявки
 * Body: { status, clientReason?, internalReason? }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const body = await request.json();
    const { status, clientReason, internalReason } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: "status обязателен" },
        { status: 400 }
      );
    }

    // Валидация статуса
    if (!VALID_STATUSES.includes(status as LeadStatus)) {
      return NextResponse.json(
        { success: false, error: "Неверный статус заявки" },
        { status: 400 }
      );
    }

    const result = await updateLeadStatus(id, status as LeadStatus, user.id, {
      clientReason,
      internalReason,
    });

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in PATCH /api/leads/[id]/status:", error);
    return NextResponse.json(
      { success: false, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
