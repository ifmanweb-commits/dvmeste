import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: { params: PageProps["params"] }
) {
  try {
    const { id: challengeId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Требуется авторизация" },
        { status: 401 }
      );
    }

    // Получаем испытание
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        test: true,
        work: true,
      },
    });

    if (!challenge) {
      return NextResponse.json(
        { success: false, error: "Испытание не найдено" },
        { status: 404 }
      );
    }

    if (!challenge.isActive) {
      return NextResponse.json(
        { success: false, error: "Испытание не активно" },
        { status: 400 }
      );
    }

    // Получаем цену разблокировки из Challenge
    const price = (challenge as any).price as number | null;
    if (price === null || price === undefined || price === 0) {
      return NextResponse.json(
        { success: false, error: "Разблокировка недоступна" },
        { status: 400 }
      );
    }

    // Получаем текущее состояние пользователя
    let userState = await prisma.challengeUserState.findUnique({
      where: {
        challengeId_userId: {
          challengeId,
          userId: user.id,
        },
      },
    });

    const attemptsLeft = userState?.attemptsLeft ?? 0;

    // Проверяем баланс
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { balance: true },
    });

    if (!currentUser || currentUser.balance < price) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Недостаточно средств",
          required: price,
          current: currentUser?.balance ?? 0,
        },
        { status: 402 }
      );
    }

    // Списываем средства и увеличиваем попытки
    const newBalance = currentUser.balance - price;
    const newAttemptsLeft = attemptsLeft + 1;

    // Транзакция: обновляем баланс, создаем транзакцию, обновляем attemptsLeft
    await prisma.$transaction([
      // Обновляем баланс пользователя
      prisma.user.update({
        where: { id: user.id },
        data: { balance: newBalance },
      }),

      // Создаем запись о транзакции
      prisma.transaction.create({
        data: {
          userId: user.id,
          type: "PURCHASE",
          amount: -price,
          balanceAfter: newBalance,
          description: `Разблокировка попытки испытания: ${challenge.title}`,
          metadata: {
            challengeId,
            challengeTitle: challenge.title,
            attemptsAdded: 1,
          },
        },
      }),

      // Обновляем или создаем состояние пользователя
      userState
        ? prisma.challengeUserState.update({
            where: { id: userState.id },
            data: { attemptsLeft: newAttemptsLeft },
          })
        : prisma.challengeUserState.create({
            data: {
              challengeId,
              userId: user.id,
              attemptsLeft: newAttemptsLeft,
            },
          }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Попытка разблокирована",
      attemptsLeft: newAttemptsLeft,
      balance: newBalance,
    });
  } catch (error) {
    console.error("[Challenge Unlock] Error:", error);
    return NextResponse.json(
      { success: false, error: "Ошибка при разблокировке" },
      { status: 500 }
    );
  }
}