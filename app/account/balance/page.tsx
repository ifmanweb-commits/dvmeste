'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Wallet } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'PURCHASE' | 'EARNING' | 'ADJUSTMENT';
  amount: number;
  balanceAfter: number;
  description: string;
  paymentId: string | null;
  metadata: any;
  createdAt: string;
}

interface TransactionsResponse {
  items: Transaction[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export default function BalancePage() {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const limit = 20;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [balanceRes, transactionsRes] = await Promise.all([
          fetch('/api/account/balance'),
          fetch(`/api/account/transactions?page=${page}&limit=${limit}`),
        ]);

        if (!balanceRes.ok || !transactionsRes.ok) {
          throw new Error('Ошибка при загрузке данных');
        }

        const balanceData = await balanceRes.json();
        const transactionsData: TransactionsResponse = await transactionsRes.json();

        setBalance(balanceData.balance);
        setTransactions(transactionsData.items);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [page]);

  const formatAmount = (amountInKopecks: number): string => {
    const rubles = Math.round(amountInKopecks / 100);
    return rubles.toLocaleString('ru-RU') + ' ₽';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeLabel = (type: Transaction['type']): string => {
    const labels: Record<Transaction['type'], string> = {
      DEPOSIT: 'Пополнение',
      WITHDRAWAL: 'Вывод средств',
      PURCHASE: 'Покупка',
      EARNING: 'Начисление',
      ADJUSTMENT: 'Корректировка',
    };
    return labels[type];
  };

  const getTypeColor = (type: Transaction['type']): string => {
    const colors: Record<Transaction['type'], string> = {
      DEPOSIT: 'text-green-600',
      WITHDRAWAL: 'text-red-600',
      PURCHASE: 'text-red-600',
      EARNING: 'text-green-600',
      ADJUSTMENT: 'text-gray-600',
    };
    return colors[type];
  };

  const getAmountSign = (type: Transaction['type']): string => {
    if (type === 'DEPOSIT' || type === 'EARNING') {
      return '+';
    }
    if (type === 'ADJUSTMENT') {
      return '';
    }
    return '-';
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-500">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-gray-900 sm:text-2xl">
            Мой счёт
          </h1>
          <Link
            href="/account"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Назад в дашборд
          </Link>
        </div>

        {/* Баланс */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Текущий баланс
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {formatAmount(balance)}
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-4">
              <Wallet className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* История транзакций */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              История операций
            </h2>
          </div>

          {error && (
            <div className="p-6">
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            </div>
          )}

          {!error && transactions.length === 0 && (
            <div className="p-6">
              <p className="text-center text-sm text-gray-500">
                История операций пуста
              </p>
            </div>
          )}

          {!error && transactions.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Дата
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Тип
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Описание
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Сумма
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Баланс после
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(transaction.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className={getTypeColor(transaction.type)}>
                            {getTypeLabel(transaction.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {transaction.description}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${getTypeColor(transaction.type)}`}>
                          {getAmountSign(transaction.type)}
                          {formatAmount(Math.abs(transaction.amount))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                          {formatAmount(transaction.balanceAfter)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Пагинация */}
              <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Назад
                </button>
                <span className="text-sm text-gray-600">
                  Страница {page}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!transactions.some((_, i) => i >= limit - 1)}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Вперёд →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}