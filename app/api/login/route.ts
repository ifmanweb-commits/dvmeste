import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email и пароль обязательны" },
        { status: 400 }
      );
    }

    // Ищем психолога по email
    const psychologist = await prisma.psychologist.findUnique({
      where: { email },
    });

    if (!psychologist) {
      return NextResponse.json(
        { error: "Неверный email или пароль" },
        { status: 401 }
      );
    }

    // Проверяем пароль
    const isValid = await bcrypt.compare(password, psychologist.passwordHash || "");

    if (!isValid) {
      return NextResponse.json(
        { error: "Неверный email или пароль" },
        { status: 401 }
      );
    }

    // TODO: создать сессию (next-auth или cookies)

    return NextResponse.json(
      { message: "Вход выполнен", id: psychologist.id },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}