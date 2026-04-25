import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyWebhookToken, mapTinkoffStatusToInternal } from '@/lib/tinkoff';

/**
 * POST /api/payments/webhook
 * Публичный эндпоинт для получения уведомлений от Т-Банка
 * Всегда возвращает 200 OK для идемпотентности
 */
export async function POST(request: NextRequest) {
  try {
    // Получаем тело запроса
    const body = await request.json();
    
    // Проверяем наличие обязательных полей
    const { OrderId, Status, Token, PaymentId, Amount } = body;
    
    if (!OrderId || !Status || !Token) {
      console.error('Webhook: missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Валидируем подпись
    const isValidToken = verifyWebhookToken(body, Token);
    if (!isValidToken) {
      console.error('Webhook: invalid token signature');
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
    }

    // Находим PaymentLink по OrderId
    const paymentLink = await prisma.paymentLink.findFirst({
      where: { id: OrderId },
      include: {
        payment: true,
      },
    });

    if (!paymentLink) {
      console.error(`Webhook: PaymentLink not found for OrderId: ${OrderId}`);
      // Возвращаем OK, чтобы Т-Банк не повторял запрос
      return new NextResponse('OK');
    }

    // Проверяем, не был ли уже обработан этот webhook
    if (!paymentLink.payment) {
      console.error(`Webhook: Payment not found for PaymentLink ${OrderId}`);
      return new NextResponse('OK');
    }

    if (paymentLink.payment.status === 'SUCCEEDED' || paymentLink.payment.status === 'REFUNDED') {
      console.log(`Webhook: already processed for PaymentLink ${OrderId}`);
      return new NextResponse('OK');
    }

    // Мапим статус Т-Банка на внутренний статус
    const internalStatus = mapTinkoffStatusToInternal(Status);

    // Обновляем статус платежа
    await prisma.payment.update({
      where: { id: paymentLink.payment.id },
      data: { status: internalStatus },
    });

    // Если платёж подтверждён (CONFIRMED) — пополняем баланс
    console.log(`Webhook: Processing payment ${OrderId}, Tinkoff status: ${Status}, internal status: ${internalStatus}, PaymentId: ${PaymentId}`);
    
    if (Status === 'CONFIRMED') {
      // ПРОВЕРКА 1: Проверяем, не была ли уже создана транзакция с этим paymentId
      // Это защищает от double-spending атаки
      const existingTransaction = await prisma.transaction.findUnique({
        where: { paymentId: paymentLink.payment.id },
      });

      if (existingTransaction) {
        console.log(`Webhook: Transaction already exists for payment ${paymentLink.payment.id}`);
        return new NextResponse('OK');
      }

      // ПРОВЕРКА 2: Проверяем соответствие суммы в webhook ожидаемой сумме
      const expectedAmountInKopecks = paymentLink.amount * 100;
      const receivedAmountInKopecks = Amount || expectedAmountInKopecks;
      
      if (receivedAmountInKopecks !== expectedAmountInKopecks) {
        console.error(
          `Webhook: Amount mismatch for payment ${OrderId}. Expected: ${expectedAmountInKopecks}, Received: ${receivedAmountInKopecks}`
        );
        // Не прерываем обработку, используем ожидаемую сумму для безопасности
      }

      // Получаем пользователя для расчёта нового баланса
      const user = await prisma.user.findUnique({
        where: { id: paymentLink.userId },
      });

      if (!user) {
        console.error(`Webhook: User not found: ${paymentLink.userId}`);
        return new NextResponse('OK');
      }

      // Сумма в рублях (используем ожидаемую сумму из paymentLink для безопасности)
      const amountInRubles = paymentLink.amount;

      // Вычисляем новый баланс
      const newBalance = user.balance + amountInRubles;

      // Выполняем транзакцию: создаём Transaction и обновляем User
      // Используем paymentId для защиты от дублирования
      await prisma.$transaction([
        prisma.transaction.create({
          data: {
            userId: paymentLink.userId,
            type: 'DEPOSIT',
            amount: amountInRubles,
            balanceAfter: newBalance,
            description: `Пополнение баланса через Т-Банк (PaymentId: ${PaymentId})`,
            paymentId: paymentLink.payment.id,
            metadata: {
              tinkoffPaymentId: PaymentId,
              tinkoffStatus: Status,
              originalAmount: expectedAmountInKopecks,
            },
          },
        }),
        prisma.user.update({
          where: { id: paymentLink.userId },
          data: { balance: newBalance },
        }),
      ]);

      console.log(`Webhook: Balance updated for user ${paymentLink.userId}. New balance: ${newBalance}`);
    }

    // Если статус FAILED — тоже логируем
    if (internalStatus === 'FAILED') {
      console.log(`Webhook: Payment failed for PaymentLink ${OrderId}. Status: ${Status}`);
    }
    
    // Если статус REFUNDED — логируем возврат
    if (internalStatus === 'REFUNDED') {
      console.log(`Webhook: Payment refunded for PaymentLink ${OrderId}. Status: ${Status}`);
    }

    return new NextResponse('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    // Всё равно возвращаем OK, чтобы избежать бесконечных повторных попыток
    return new NextResponse('OK');
  }
}

/**
 * GET /api/payments/webhook
 * Для тестирования — возвращает статус сервиса
 */
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'tinkoff-webhook' });
}