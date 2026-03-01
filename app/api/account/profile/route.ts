import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { emailService } from "@/lib/email.service";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const errors: Record<string, string> = {};

    // Получаем текущего пользователя
    const currentPsychologist = await prisma.psychologist.findUnique({
      where: { email: session.user.email },
      select: { email: true },
    });

    if (!currentPsychologist) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Проверка на смену email
    const emailChanged = currentPsychologist.email !== data.email;

    if (emailChanged) {
      // Проверяем, не занят ли новый email
      const existing = await prisma.psychologist.findUnique({
        where: { email: data.email },
      });

      if (existing) {
        errors.email = "Этот email уже зарегистрирован";
      }
    }

    // Валидация
    if (data.contactInfo && data.contactInfo.length > 100) {
      errors.contactInfo = "Максимум 100 символов";
    }

    if (data.price && (!/^\d+$/.test(data.price) || parseInt(data.price) < 0)) {
      errors.price = "Некорректная цена";
    }

    // Если есть ошибки — возвращаем
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    // Подготовка данных для обновления
    const updateData: any = {
      fullName: data.fullName,
      email: data.email,
      price: parseInt(data.price),
      contactInfo: data.contactInfo,
    };

    // Если меняется email — генерируем токен и сбрасываем подтверждение
    if (emailChanged) {
      const token = crypto.randomBytes(32).toString("hex");
      updateData.emailVerifyToken = token;
      updateData.emailVerified = false;
      updateData.emailVerifiedAt = null;
    }

    // Обновляем
    const updated = await prisma.psychologist.update({
      where: { email: session.user.email },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        price: true,
        contactInfo: true,
      },
    });

    // Если email изменился — отправляем письмо с подтверждением
    if (emailChanged && updateData.emailVerifyToken) {
      try {
        await emailService.sendVerificationEmail(
          data.email,
          updateData.emailVerifyToken
        );
      } catch (emailError) {
        console.error("Failed to send verification email after email change:", emailError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: updated,
      emailChanged: emailChanged,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}