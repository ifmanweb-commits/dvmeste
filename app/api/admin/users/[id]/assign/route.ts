import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Проверяем авторизацию и права админа
    await requireAdmin();

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
        isAdmin: true,
        isManager: true
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
    if ((role === 'ADMIN' && user.isAdmin) || (role === 'MANAGER' && user.isManager)) {
      return NextResponse.json(
        { error: `Пользователь уже имеет роль ${role === 'ADMIN' ? 'администратора' : 'менеджера'}` },
        { status: 400 }
      );
    }

    // Назначаем роль
    const updateData = role === 'ADMIN' 
      ? { isAdmin: true, isManager: false }
      : { isManager: true, isAdmin: false };

    await prisma.user.update({
      where: { id },
      data: updateData
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