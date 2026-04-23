import { NextRequest, NextResponse } from "next/server";
import { createLeadForAuthenticatedClient, getPsychologistLeads } from "@/lib/actions/leads";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { LeadStatus } from "@prisma/client";

/**
 * POST /api/leads - Создание новой заявки от авторизованного клиента
 * Body: { psychologistId, message, honeypot?, formOpenTime? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { psychologistId, message, honeypot, formOpenTime } = body;

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

    // Проверка обязательных полей
    if (!psychologistId || !message) {
      return NextResponse.json(
        { success: false, error: "Не все обязательные поля заполнены" },
        { status: 400 }
      );
    }

    // Получаем текущего пользователя (психолог) - проверяем что это не психолог
    const user = await getCurrentUser();
    if (user) {
      return NextResponse.json(
        { success: false, error: "Психологи не могут подавать заявки" },
        { status: 403 }
      );
    }

    // Получаем текущего клиента из сессии
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;
    
    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Требуется авторизация" },
        { status: 401 }
      );
    }
    
    // Ищем сессию
    const session = await prisma.session.findUnique({
      where: { sessionToken }
    });
    
    if (!session || session.expires < new Date()) {
      return NextResponse.json(
        { success: false, error: "Требуется авторизация" },
        { status: 401 }
      );
    }
    
    // Получаем clientId из сессии
    const clientId = (session as any).clientId;
    
    if (!clientId) {
      return NextResponse.json(
        { success: false, error: "Это не клиентская сессия" },
        { status: 401 }
      );
    }

    const result = await createLeadForAuthenticatedClient(
      {
        psychologistId,
        clientId,
        message,
      },
      request
    );

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        leadId: result.leadId,
        clientId: result.clientId 
      });
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
