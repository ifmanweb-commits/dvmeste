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
      select: { role: true }
    });

    if (currentUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
    }

    const { role } = await request.json();

    if (role !== 'MANAGER' && role !== 'ADMIN') {
      return NextResponse.json(
        { error: "Некорректная роль" },
        { status: 400 }
      );
    }

    // Проверяем, что пользователь существует
    const user = await prisma.user.findUnique({
      where: { id },
      select: { 
        emailVerified: true,
        role: true 
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    // Проверяем, подтверждён ли email
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Нельзя назначить роль пользователю с неподтверждённым email" },
        { status: 400 }
      );
    }

    // Проверяем, не назначена ли уже такая роль
    if (user.role === role) {
      return NextResponse.json(
        { error: `Пользователь уже имеет роль ${role === 'ADMIN' ? 'администратора' : 'менеджера'}` },
        { status: 400 }
      );
    }

    // Назначаем роль
    await prisma.user.update({
      where: { id },
      data: { role }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error assigning role:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}