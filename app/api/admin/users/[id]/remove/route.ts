import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    
    // Проверяем авторизацию
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    // Проверяем, что текущий пользователь - админ
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, isAdmin: true }
    });

    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
    }

    // Проверяем, не пытается ли админ снять права с самого себя
    if (currentUser.id === id) {
      return NextResponse.json(
        { error: "Нельзя снять права с самого себя" },
        { status: 400 }
      );
    }

    // Получаем информацию о пользователе
    const user = await prisma.user.findUnique({
      where: { id },
      select: { isAdmin: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    // Если снимаем права с админа, проверяем что это не последний админ
    if (user.isAdmin) {
      const adminCount = await prisma.user.count({
        where: { isAdmin: true }
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Нельзя удалить последнего администратора" },
          { status: 400 }
        );
      }
    }

    // Снимаем роль (ставим false для обоих флагов)
    await prisma.user.update({
      where: { id },
      data: {
        isAdmin: false,
        isManager: false
        // isPsychologist не трогаем
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error removing role:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}