import { NextRequest, NextResponse } from "next/server";
import { updateLeadStatus, acceptLead, rejectLead, completeLead } from "@/lib/actions/leads";
import { getCurrentUser } from "@/lib/auth/session";
import { LeadStatus, LeadResolution } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Список допустимых статусов
const VALID_STATUSES = ["NEW", "ACCEPTED", "COMPLETED"] as const;

// Список допустимых resolution
const VALID_RESOLUTIONS = [
  "PSYCHOLOGIST_REJECTED",
  "NO_CONTACT",
  "NO_AGREEMENT",
  "CLIENT_DROPPED",
  "FREE_ONLY",
  "PAID_COMPLETED",
] as const;

/**
 * PATCH /api/leads/[id]/status - Обновление статуса заявки
 * Body: { status, resolution?, clientReason?, internalReason? }
 * Или: { action: "accept" | "reject" | "complete", resolution?, clientReason?, internalReason? }
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
    const { status, resolution, action, clientReason, internalReason } = body;

    // Поддержка нового формата с action
    if (action) {
      switch (action) {
        case "accept":
          const acceptResult = await acceptLead(id, user.id);
          return NextResponse.json(acceptResult);

        case "reject":
          const rejectResult = await rejectLead(id, user.id, { clientReason, internalReason });
          return NextResponse.json(rejectResult);

        case "complete":
          if (!resolution || !VALID_RESOLUTIONS.includes(resolution as LeadResolution)) {
            return NextResponse.json(
              { success: false, error: "resolution обязателен и должен быть допустимым" },
              { status: 400 }
            );
          }
          const completeResult = await completeLead(id, user.id, resolution as LeadResolution);
          return NextResponse.json(completeResult);

        default:
          return NextResponse.json(
            { success: false, error: "Неверное действие" },
            { status: 400 }
          );
      }
    }

    // Старый формат со status
    if (!status) {
      return NextResponse.json(
        { success: false, error: "status или action обязателен" },
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

    // Валидация resolution если указан
    if (resolution && !VALID_RESOLUTIONS.includes(resolution as LeadResolution)) {
      return NextResponse.json(
        { success: false, error: "Неверный resolution" },
        { status: 400 }
      );
    }

    const result = await updateLeadStatus(id, status as LeadStatus, user.id, {
      clientReason,
      internalReason,
      resolution: resolution as LeadResolution | undefined,
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