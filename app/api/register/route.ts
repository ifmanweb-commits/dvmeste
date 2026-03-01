import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugFromName } from "@/lib/actions/psychologist-form";

export async function POST(req: Request) {
  try {
    const { email, fullName } = await req.json();

    if (!email || !fullName) {
      return NextResponse.json(
        { error: "Имя и email обязательны" },
        { status: 400 }
      );
    }

    // Проверяем, существует ли уже пользователь
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже существует" },
        { status: 400 }
      );
    }

    // Генерируем slug из имени
    let slug = slugFromName(fullName);
    let counter = 1;
    let finalSlug = slug;
    while (await prisma.psychologist.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    // Создаём пользователя и психолога
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          fullName,
          role: 'USER',
        }
      });

      const psychologist = await tx.psychologist.create({
        data: {
          email,
          fullName,
          slug: finalSlug,
          status: "CANDIDATE",
          emailVerified: false,
          gender: "Не указан",
          birthDate: new Date("2000-01-01"),
          city: "",
          workFormat: "",
          mainParadigm: [],
          shortBio: "",
          longBio: "",
          price: 0,
          contactInfo: "",
          images: [],
          userId: user.id,
        },
      });

      return { user, psychologist };
    });

    // ВАЖНО: Отправляем Magic Link через NextAuth
    // Для этого нужно использовать NextAuth, но из API route это сложно
    // Поэтому возвращаем успех и на фронтенде вызываем signIn

    return NextResponse.json({
      success: true,
      message: "Регистрация успешна",
      email: email
    });

  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}