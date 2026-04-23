import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { initPayment } from '@/lib/tinkoff';

const MIN_AMOUNT = 100; // Минимальная сумма в рублях

/**
 * POST /api/payments/create
 * Создаёт платёж через Т-Банк
 * Требует авторизации (только для психологов)
 */
export async function POST(request: NextRequest) {
  try {
    // Проверяем авторизацию
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 }
      );
    }

    // Парсим тело запроса
    const body = await request.json();
    const { amount, description } = body as { amount: number; description?: string };

    // Валидация суммы
    if (!amount || typeof amount !== 'number' || !Number.isInteger(amount)) {
      return NextResponse.json(
        { error: 'Сумма должна быть целым числом' },
        { status: 400 }
      );
    }

    if (amount < MIN_AMOUNT) {
      return NextResponse.json(
        { error: `Минимальная сумма платежа — ${MIN_AMOUNT} рублей` },
        { status: 400 }
      );
    }

    // Формируем описание по умолчанию, если не передано
    const paymentDescription = description || `Пополнение баланса на ${amount}₽`;

    // Создаём запись Payment в статусе PENDING
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        amount,
        status: 'PENDING',
        provider: 'Tinkoff',
        description: paymentDescription,
      },
    });

    // Создаём PaymentLink (orderId для Т-Банка)
    const paymentLink = await prisma.paymentLink.create({
      data: {
        userId: user.id,
        paymentId: payment.id,
        amount,
        redirectUrl: '', // Будет обновлён после вызова API
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 минут
      },
    });

    // Формируем URL для webhook (полный абсолютный URL)
    const host = request.headers.get('host') || 'dvmeste.ru';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const notificationUrl = `${protocol}://${host}/api/payments/webhook`;

    // Вызываем API Т-Банка для инициализации платежа
    const tinkoffResponse = await initPayment(
      amount,
      paymentLink.id, // OrderId = ID платежной ссылки
      paymentDescription,
      notificationUrl
    );

    // Обновляем PaymentLink redirectUrl и Payment providerId
    await Promise.all([
      prisma.paymentLink.update({
        where: { id: paymentLink.id },
        data: { redirectUrl: tinkoffResponse.paymentUrl },
      }),
      prisma.payment.update({
        where: { id: payment.id },
        data: { providerId: tinkoffResponse.paymentId },
      }),
    ]);

    // Возвращаем ссылку на оплату клиенту
    return NextResponse.json({
      paymentUrl: tinkoffResponse.paymentUrl,
      paymentId: payment.id,
      amount,
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    
    if (error instanceof Error && error.message.includes('Tinkoff API')) {
      return NextResponse.json(
        { error: error.message },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: 'Ошибка при создании платежа' },
      { status: 500 }
    );
  }
}