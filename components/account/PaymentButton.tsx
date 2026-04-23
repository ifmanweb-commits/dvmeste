'use client';

import { useState } from 'react';

interface PaymentButtonProps {
  minAmount?: number;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
}

/**
 * Кнопка для пополнения баланса через Т-Банк
 */
export function PaymentButton({ 
  minAmount = 100, 
  onSuccess, 
  onError 
}: PaymentButtonProps) {
  const [amount, setAmount] = useState<number>(minAmount);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreatePayment = async () => {
    if (amount < minAmount) {
      setError(`Минимальная сумма платежа — ${minAmount} рублей`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          description: `Пополнение баланса на ${amount}₽`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при создании платежа');
      }

      // Перенаправляем пользователя на страницу оплаты Т-Банка
      if (data.paymentUrl) {
        onSuccess?.(data.paymentId);
        window.location.href = data.paymentUrl;
      } else {
        throw new Error('Не удалось получить ссылку на оплату');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Произошла неизвестная ошибка';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="payment-button-container">
      <div className="mb-4">
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
          Сумма пополнения (₽)
        </label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(Math.max(minAmount, parseInt(e.target.value) || 0))}
          min={minAmount}
          step={100}
          className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        onClick={handleCreatePayment}
        disabled={isLoading || amount < minAmount}
        className={`
          px-6 py-3 rounded-md font-medium text-white
          ${isLoading || amount < minAmount
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          }
          transition-colors duration-200
        `}
      >
        {isLoading ? 'Создание платежа...' : `Пополнить на ${amount}₽`}
      </button>

      <p className="mt-2 text-xs text-gray-500">
        Оплата через Т-Банк (карты МИР, Visa, Mastercard)
      </p>
    </div>
  );
}