import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from 'crypto';
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(request: Request) {
  try {
    // Проверяем авторизацию и права админа
    const user = await getCurrentUser();

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
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

    // Ищем пользователя по emailHash
    const emailHash = createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
    
    console.log('[find] Поиск пользователя:', { email, emailHash });
    
    const foundUser = await prisma.user.findUnique({
      where: { emailHash },
      select: {
        id: true,
        email: true,
        fullName: true,
        isAdmin: true,
        isManager: true,
        emailVerified: true,
        status: true,
        balance: true
      }
    });

    console.log('[find] Результат поиска:', foundUser ? 'найден' : 'не найден');
    
    if (!foundUser) {
      return NextResponse.json({ user: null });
    }

    // Определяем роль для отображения
    let role: 'ADMIN' | 'MANAGER' | 'USER' = 'USER';
    if (foundUser.isAdmin) role = 'ADMIN';
    else if (foundUser.isManager) role = 'MANAGER';

    // Форматируем ответ
    const formattedUser = {
      id: foundUser.id,
      name: foundUser.fullName || 'Без имени',
      email: foundUser.email,
      role,
      isActive: foundUser.emailVerified !== null,
      inCatalog: foundUser.status === 'ACTIVE',
      balance: foundUser.balance
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