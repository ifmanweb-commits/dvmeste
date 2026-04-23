# Интеграция с Т-Банк Кассой

## Обзор

Реализована интеграция с платёжной системой Т-Банк (Тинькофф Касса) для приёма платежей на сайте dvmeste.ru.

## API endpoints

### POST /api/payments/create

Создаёт новый платёж и возвращает ссылку на оплату.

**Требует авторизации** (только для психологов)

**Запрос:**
```json
{
  "amount": 1000,
  "description": "Пополнение баланса"
}
```

**Ответ:**
```json
{
  "paymentUrl": "https://pay.tinkoff.ru/...",
  "paymentId": "payment_id",
  "amount": 1000
}
```

### POST /api/payments/webhook

Публичный эндпоинт для получения уведомлений от Т-Банка.

**Важно:** URL webhook должен быть доступен из интернета. Для локальной разработки используйте ngrok или аналогичный инструмент.

Пример URL для настройки в личном кабинете Т-Банка:
```
https://dvmeste.ru/api/payments/webhook
```

## Модели данных

### Payment
- `id` — уникальный идентификатор
- `userId` — ID пользователя
- `amount` — сумма в рублях
- `status` — статус (PENDING, SUCCEEDED, FAILED, REFUNDED)
- `provider` — "Tinkoff"
- `providerId` — PaymentId от Т-Банка
- `description` — описание

### PaymentLink
- `id` — уникальный идентификатор (используется как OrderId)
- `userId` — ID пользователя
- `paymentId` — связь с Payment
- `amount` — сумма
- `redirectUrl` — ссылка на оплату
- `expiresAt` — время истечения

## Переменные окружения

Добавьте в `.env`:

```env
# Tinkoff Kassa settings
TINKOFF_TERMINAL_KEY=your_terminal_key
TINKOFF_PASSWORD=your_password
```

## Использование компонента

```tsx
import { PaymentButton } from '@/components/account/PaymentButton';

function BalancePage() {
  return (
    <PaymentButton 
      minAmount={100}
      onSuccess={(paymentId) => console.log('Payment created:', paymentId)}
      onError={(error) => console.error('Payment error:', error)}
    />
  );
}
```

## Настройка в личном кабинете Т-Банка

1. Войдите в личный кабинет Т-Банк Кассы
2. Перейдите в раздел "Настройки" → "Вебхуки"
3. Укажите URL: `https://dvmeste.ru/api/payments/webhook`
4. Сохраните настройки

## Статусы платежей

| Статус Т-Банка | Внутренний статус | Описание |
|---------------|-------------------|----------|
| NEW | PENDING | Платёж создан |
| FORM_SHOWED | PENDING | Показана форма оплаты |
| DEADLINE_EXPIRED | FAILED | Время оплаты истекло |
| CANCELLED | FAILED | Платёж отменён |
| REJECTED | FAILED | Платёж отклонён |
| CONFIRMED | SUCCEEDED | Платёж подтверждён |
| REFUNDED | REFUNDED | Платёж возвращён |

## Безопасность

- Все запросы к API Т-Банка подписываются с помощью SHA-256
- Webhook уведомления проверяются на подлинность
- Минимальная сумма платежа: 100 рублей
- Требуется авторизация пользователя для создания платежа

## Миграция БД

Миграция `20260423205847_add_payment_models` создаёт:
- Таблицу `Payment`
- Таблицу `PaymentLink`
- Enum `PaymentStatus`
- Связи с таблицей `User`