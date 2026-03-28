import { NextRequest, NextResponse } from "next/server";
import { createLead, getPsychologistLeads } from "@/lib/actions/leads";
import { getCurrentUser } from "@/lib/auth/session";
import { LeadStatus } from "@prisma/client";

/**
 * POST /api/leads - Создание новой заявки
 * Body: { psychologistId, client, message, rememberMe, consent, honeypot?, formOpenTime? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { psychologistId, client, message, rememberMe, consent, honeypot, formOpenTime } = body;

    // Проверка honeypot (защита от ботов)
    if (honeypot && honeypot.trim() !== '') {
      return NextResponse.json(
        { success: false, error: "Обнаружена подозрительная активность" },
        { status: 400 }
      );
    }

    // Проверка времени заполнения формы (минимум 3 секунды)
    if (formOpenTime) {
      const openTime = new Date(formOpenTime).getTime();
      const submitTime = Date.now();
      const timeDiff = submitTime - openTime;
      
      if (timeDiff < 3000) {
        return NextResponse.json(
          { success: false, error: "Слишком быстрая отправка формы" },
          { status: 400 }
        );
      }
    }

    if (!psychologistId || !client || !client.email || !message || !consent) {
      return NextResponse.json(
        { success: false, error: "Не все обязательные поля заполнены" },
        { status: 400 }
      );
    }

    const result = await createLead(
      {
        psychologistId,
        client,
        message,
        rememberMe,
        consent,
      },
      request
    );

    if (result.success) {
      return NextResponse.json({ success: true, leadId: result.leadId });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in POST /api/leads:", error);
    return NextResponse.json(
      { success: false, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/leads - Получение списка заявок психолога
 * Query params: statuses (comma-separated), page, limit
 */
export async function GET(request: NextRequest) {
  try {
    // Получаем текущего пользователя
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Требуется авторизация" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const statusesParam = searchParams.get("statuses");
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 20;

    // Парсим статусы
    let statuses: LeadStatus[] | undefined;
    if (statusesParam) {
      statuses = statusesParam.split(",").filter(Boolean) as LeadStatus[];
    }

    const result = await getPsychologistLeads(user.id, {
      statuses,
      page,
      limit,
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
    console.error("Error in GET /api/leads:", error);
    return NextResponse.json(
      { success: false, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
