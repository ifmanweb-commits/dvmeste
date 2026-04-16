import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

/**
 * POST /api/complaints/client - Создание жалобы от авторизованного клиента на психолога
 * Требует авторизации через сессию
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;

    if (!sessionToken) {
      return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });
    }

    // Ищем сессию
    const session = await prisma.session.findUnique({
      where: { sessionToken },
    });

    if (!session || session.expires < new Date()) {
      return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });
    }

    // Получаем clientId из сессии
    const clientId = (session as any).clientId;

    if (!clientId) {
      return NextResponse.json({ success: false, error: "Это не клиентская сессия" }, { status: 401 });
    }

    const body = await request.json();
    const { psychologistName, psychologistSlug, complaintText, contactsText, sourceUrl } = body;

    if (!psychologistName || !complaintText || !contactsText) {
      return NextResponse.json(
        { success: false, error: "Не все обязательные поля заполнены" },
        { status: 400 }
      );
    }

    // Находим клиента (он должен существовать, т.к. сессия валидна)
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json({ success: false, error: "Клиент не найден" }, { status: 404 });
    }

    // Находим психолога по slug или имени
    let psychologistId: string | null = null;

    if (psychologistSlug) {
      const psychologist = await prisma.user.findFirst({
        where: {
          slug: psychologistSlug,
        },
      });
      if (psychologist) {
        psychologistId = psychologist.id;
      }
    }

    // Если не нашли по slug, ищем по имени (частичное совпадение)
    if (!psychologistId) {
      const psychologist = await prisma.user.findFirst({
        where: {
          fullName: {
            contains: psychologistName,
            mode: "insensitive",
          },
        },
      });
      if (psychologist) {
        psychologistId = psychologist.id;
      }
    }

    // Создаём жалобу
    const complaint = await prisma.complaint.create({
      data: {
        fromType: "client",
        fromClientId: clientId,
        toPsychologistId: psychologistId || undefined,
        reason: complaintText,
        description: contactsText,
      },
    });

    return NextResponse.json({
      success: true,
      complaintId: complaint.id,
      message: "Жалоба успешно отправлена",
    });
  } catch (error) {
    console.error("Error in POST /api/complaints/client:", error);
    return NextResponse.json(
      { success: false, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}