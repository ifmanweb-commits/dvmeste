'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  minAmount?: number;
}

/**
 * Модальное окно для пополнения баланса через Т-Банк
 */
export function DepositModal({ isOpen, onClose, minAmount = 100 }: DepositModalProps) {
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
        window.location.href = data.paymentUrl;
      } else {
        throw new Error('Не удалось получить ссылку на оплату');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Произошла неизвестная ошибка';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 backdrop-blur-sm bg-black/30"
        onClick={onClose}
      />
      <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 border border-white/20">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Пополнение баланса
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          Оплата через Т-Банк (карты МИР, Visa, Mastercard)
        </p>

        <div className="mb-4">
          <label htmlFor="deposit-amount" className="block text-sm font-medium text-gray-700 mb-2">
            Сумма пополнения (₽)
          </label>
          <input
            type="number"
            id="deposit-amount"
            value={amount}
            onChange={(e) => setAmount(Math.max(minAmount, parseInt(e.target.value) || minAmount))}
            min={minAmount}
            step={100}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleCreatePayment}
            disabled={isLoading || amount < minAmount}
            className={`
              flex-1 px-4 py-2 rounded-lg font-medium text-white transition-colors
              ${isLoading || amount < minAmount
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
              }
            `}
          >
            {isLoading ? 'Создание платежа...' : `Пополнить на ${amount}₽`}
          </button>
        </div>

        <p className="mt-4 text-xs text-gray-500 text-center">
          Минимальная сумма: {minAmount}₽
        </p>
      </div>
    </div>
  );
}