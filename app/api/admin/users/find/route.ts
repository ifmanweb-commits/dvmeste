import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from 'crypto';
import { requireAdmin } from "@/lib/auth/require";

export async function GET(request: Request) {
  try {
    // Проверяем авторизацию и права админа
    await requireAdmin();
    
    // Получаем email из query параметра
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: "Email обязателен" },
        { status: 400 }
      );
    }

    // Ищем пользователя по emailHash
    const emailHash = createHash('sha256').update(email.toLowerCase().trim()).digest('hex')
    
    const user = await prisma.user.findUnique({
      where: { emailHash },
      select: {
        id: true,
        email: true,
        fullName: true,
        isAdmin: true,
        isManager: true,
        emailVerified: true,
        status: true
      }
    });

    if (!user) {
      return NextResponse.json({ user: null });
    }

    // Определяем роль для отображения
    let role: 'ADMIN' | 'MANAGER' | 'USER' = 'USER';
    if (user.isAdmin) role = 'ADMIN';
    else if (user.isManager) role = 'MANAGER';

    // Форматируем ответ
    const formattedUser = {
      id: user.id,
      name: user.fullName || 'Без имени',
      email: user.email,
      role,
      isActive: user.emailVerified !== null,
      inCatalog: user.status === 'ACTIVE'
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