import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { emailService } from "@/lib/email.service";

export async function POST(req: Request) {
  try {
    const { email, password, fullName } = await req.json();

    // Валидация
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Все поля обязательны" },
        { status: 400 }
      );
    }

    // Проверяем, существует ли уже психолог с таким email
    const existing = await prisma.psychologist.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже существует" },
        { status: 400 }
      );
    }

    // Хэшируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создаём психолога
    const psychologist = await prisma.psychologist.create({
      data: {
        email,
        passwordHash: hashedPassword,
        fullName,
        status: "PENDING",
        // Обязательные поля заполняем заглушками
        slug: email.split("@")[0] + "-" + Date.now(),
        gender: "unknown",
        birthDate: new Date("2000-01-01"),
        city: "",
        workFormat: "",
        mainParadigm: [],
        shortBio: "",
        longBio: "",
        price: 0,
        contactInfo: "",
        images: [],
      },
    });

    // после создания psychologist, перед return:
    const token = crypto.randomBytes(32).toString("hex");

    await prisma.psychologist.update({
      where: { id: psychologist.id },
      data: { emailVerifyToken: token },
    });
    // TODO: отправить письмо с подтверждением (позже)
    console.log("\n=== Ссылка для подтверждения ===\n");
    console.log(`http://localhost:3000/verify?token=${token}`);
    console.log("\n================================\n");

    try {
      await emailService.sendVerificationEmail(email, token);
      console.log(`✅ Verification email ready for ${email}`);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }
    return NextResponse.json(
      { message: "Регистрация успешна", id: psychologist.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}