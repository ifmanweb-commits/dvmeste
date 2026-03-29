import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashEmail } from "@/lib/utils/hash-email";

/**
 * POST /api/complaints/public - Создание публичной жалобы (от клиента на психолога)
 * Не требует авторизации
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { psychologistName, psychologistSlug, email, clientId, complaintText, contactsText, sourceUrl } = body;

    if (!psychologistName || !email || !complaintText || !contactsText) {
      return NextResponse.json(
        { success: false, error: "Не все обязательные поля заполнены" },
        { status: 400 }
      );
    }

    // Приоритет 1: Ищем клиента по email (который указал пользователь)
    const emailHash = hashEmail(email.toLowerCase());
    let client = await prisma.client.findUnique({
      where: { emailHash },
    });

    // Приоритет 2: Если не нашли по email, пробуем найти по clientId из localStorage
    if (!client && clientId) {
      client = await prisma.client.findUnique({
        where: { id: clientId },
      });
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
        fromClientId: client?.id || null,  // null если клиент не найден (анонимная жалоба)
        toPsychologistId: psychologistId || undefined,
        reason: complaintText,
        description: contactsText,
      },
    });

    return NextResponse.json({ 
      success: true, 
      complaintId: complaint.id,
      message: "Жалоба успешно отправлена" 
    });
  } catch (error) {
    console.error("Error in POST /api/complaints/public:", error);
    return NextResponse.json(
      { success: false, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}