import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    
    // Проверяем авторизацию
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    // Проверяем, что текущий пользователь - админ
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    if (currentUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
    }

    // Получаем email из query параметра
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: "Email обязателен" },
        { status: 400 }
      );
    }

    // Ищем пользователя
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        emailVerified: true,
        psychologist: {
          select: {
            id: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ user: null });
    }

    // Форматируем ответ
    const formattedUser = {
      id: user.id,
      name: user.fullName || 'Без имени',
      email: user.email,
      role: user.role,
      isActive: user.emailVerified !== null,
      inCatalog: !!user.psychologist
    };

    return NextResponse.json({ user: formattedUser });

  } catch (error) {
    console.error("Error finding user:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}