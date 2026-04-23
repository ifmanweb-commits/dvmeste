import crypto from 'crypto';

const TINKOFF_API_URL = 'https://securepay.tinkoff.ru/v2';
const TERMINAL_KEY = process.env.TINKOFF_TERMINAL_KEY;
const PASSWORD = process.env.TINKOFF_PASSWORD;

if (!TERMINAL_KEY || !PASSWORD) {
  throw new Error('TINKOFF_TERMINAL_KEY and TINKOFF_PASSWORD must be set in environment variables');
}

// Гарантируем, что PASSWORD определён (для TypeScript)
const TINKOFF_PASSWORD = PASSWORD!;
const TINKOFF_TERMINAL_KEY = TERMINAL_KEY!;

/**
 * Формирует подпись запроса к API Т-Банка
 * Алгоритм:
 * 1. Сортируем ключи параметров по возрастанию
 * 2. Конкатенируем значения в строку
 * 3. Добавляем пароль в конец
 * 4. Хешируем SHA-256
 */
export function generateToken(params: Record<string, any>, password: string): string {
  const sortedKeys = Object.keys(params).sort();
  const concatenated = sortedKeys.map((key) => params[key]).join('');
  const stringToHash = concatenated + password;
  return crypto.createHash('sha256').update(stringToHash).digest('hex');
}

/**
 * Инициализация платежа (вызов API Init)
 * @param amount - сумма в рублях
 * @param orderId - уникальный ID заказа в вашей системе
 * @param description - описание платежа
 * @param notificationUrl - URL для webhook уведомлений
 * @param successUrl - URL для редиректа после успешной оплаты (опционально)
 * @param failUrl - URL для редиректа после неудачной оплаты (опционально)
 */
export async function initPayment(
  amount: number,
  orderId: string,
  description: string,
  notificationUrl: string,
  successUrl?: string,
  failUrl?: string
): Promise<{ paymentId: string; paymentUrl: string; errorCode?: string }> {
  const amountInKopecks = amount * 100; // Конвертируем рубли в копейки

  const payload = {
    TerminalKey: TINKOFF_TERMINAL_KEY,
    Amount: amountInKopecks,
    OrderId: orderId,
    Description: description,
    NotificationURL: notificationUrl,
    PayType: 'O', // Одностадийный платеж
    ...(successUrl && { SuccessURL: successUrl }),
    ...(failUrl && { FailURL: failUrl }),
  };

  const token = generateToken(payload, TINKOFF_PASSWORD);

  const response = await fetch(`${TINKOFF_API_URL}/Init`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...payload,
      Token: token,
    }),
  });

  const data = await response.json();

  if (!data.Success) {
    throw new Error(`Tinkoff API error: ${data.ErrorCode || 'Unknown error'} - ${data.Message || 'No message'}`);
  }

  return {
    paymentId: data.PaymentId,
    paymentUrl: data.PaymentURL,
    errorCode: data.ErrorCode,
  };
}

/**
 * Проверка статуса платежа (вызов API GetState)
 * @param paymentId - ID платежа в системе Т-Банка
 */
export async function getPaymentStatus(paymentId: string): Promise<{
  status: string;
  amount: number;
  errorCode?: string;
}> {
  const payload = {
    TerminalKey: TINKOFF_TERMINAL_KEY,
    PaymentId: paymentId,
  };

  const token = generateToken(payload, TINKOFF_PASSWORD);

  const response = await fetch(`${TINKOFF_API_URL}/GetState`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...payload,
      Token: token,
    }),
  });

  const data = await response.json();

  if (!data.Success) {
    throw new Error(`Tinkoff API error: ${data.ErrorCode || 'Unknown error'} - ${data.Message || 'No message'}`);
  }

  return {
    status: data.Status,
    amount: data.Amount,
    errorCode: data.ErrorCode,
  };
}

/**
 * Проверка подписи webhook уведомления от Т-Банка
 * @param params - параметры из тела webhook запроса
 * @param receivedToken - токен из поля Token в запросе
 */
export function verifyWebhookToken(params: Record<string, any>, receivedToken: string): boolean {
  // Убираем поле Token из параметров для проверки
  const { Token, ...restParams } = params;
  const calculatedToken = generateToken(restParams, TINKOFF_PASSWORD);
  return calculatedToken === receivedToken;
}

/**
 * Маппинг статусов Т-Банка на внутренние статусы
 * Документация: https://www.tbank.ru/kassa/dev/api/payments/
 */
export function mapTinkoffStatusToInternal(tinkoffStatus: string): 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED' {
  switch (tinkoffStatus) {
    // Успешные статусы
    case 'CONFIRMED':
      return 'SUCCEEDED';
    
    // Возвраты
    case 'REFUNDED':
      return 'REFUNDED';
    
    // Статусы отказа/неудачи
    case 'REJECTED':
    case 'CANCELLED':
    case 'DEADLINE_EXPIRED':
    case 'AUTH_FAIL':
      return 'FAILED';
    
    // Ожидающие статусы (по умолчанию)
    case 'NEW':
    case 'FORM_SHOWED':
    case 'AUTHORIZING':
    default:
      return 'PENDING';
  }
}
