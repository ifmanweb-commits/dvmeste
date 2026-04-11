'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Wallet, X } from 'lucide-react';

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

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  moderator?: {
    id: string;
    fullName: string | null;
    email: string;
  } | null;
}

export default function BalancePage() {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSupervisor, setIsSupervisor] = useState(false);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);

  const limit = 20;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [balanceRes, transactionsRes, userRes] = await Promise.all([
          fetch('/api/account/balance'),
          fetch(`/api/account/transactions?page=${page}&limit=${limit}`),
          fetch('/api/account/me'),
        ]);

        if (!balanceRes.ok || !transactionsRes.ok) {
          throw new Error('Ошибка при загрузке данных');
        }

        const balanceData = await balanceRes.json();
        const transactionsData: TransactionsResponse = await transactionsRes.json();
        const userData = await userRes.json();

        setBalance(balanceData.balance);
        setTransactions(transactionsData.items);
        setIsSupervisor(userData.user?.isSupervisor || false);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [page]);

  // Загрузка заявок на вывод
  useEffect(() => {
    if (isSupervisor) {
      fetch('/api/account/withdrawal-requests')
        .then((res) => res.json())
        .then((data) => {
          if (data.items) {
            setWithdrawalRequests(data.items);
          }
        })
        .catch(console.error);
    }
  }, [isSupervisor]);

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

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    const amountInRubles = parseInt(withdrawAmount.replace(/\D/g, '') || '0', 10);
    const amountInKopecks = amountInRubles * 100;

    if (amountInKopecks <= 0) {
      setSubmitError('Введите корректную сумму');
      setIsSubmitting(false);
      return;
    }

    if (amountInKopecks > balance) {
      setSubmitError('Недостаточно средств на балансе');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/account/withdrawal-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountInKopecks }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка при создании заявки');
      }

      // Обновляем баланс
      setBalance(data.newBalance);
      // Добавляем заявку в список
      setWithdrawalRequests([data.withdrawalRequest, ...withdrawalRequests]);
      // Закрываем модалку
      setIsModalOpen(false);
      setWithdrawAmount('');
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusLabel = (status: WithdrawalRequest['status']): string => {
    const labels: Record<WithdrawalRequest['status'], string> = {
      PENDING: 'Ожидает обработки',
      APPROVED: 'Обработана',
      REJECTED: 'Отклонена',
    };
    return labels[status];
  };

  const getStatusColor = (status: WithdrawalRequest['status']): string => {
    const colors: Record<WithdrawalRequest['status'], string> = {
      PENDING: 'text-yellow-600 bg-yellow-50',
      APPROVED: 'text-green-600 bg-green-50',
      REJECTED: 'text-red-600 bg-red-50',
    };
    return colors[status];
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-500">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Мой счёт
          </h1>
        </header>

        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Баланс
          </h2>
        
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Текущий баланс
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatAmount(balance)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {isSupervisor && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Вывести деньги
                  </button>
                )}
                <div className="rounded-full bg-green-100 p-4">
                  <Wallet className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Заявки на вывод - только для супервизоров и только если есть необработанные заявки */}
        {isSupervisor && withdrawalRequests.some(r => r.status === 'PENDING') && (
          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Заявки на вывод
            </h2>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="space-y-3">
                {withdrawalRequests
                  .filter(r => r.status === 'PENDING')
                  .slice(0, 5)
                  .map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {formatAmount(request.amount)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(request.createdAt)}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                        {getStatusLabel(request.status)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </section>
        )}

        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            История операций
          </h2>
        
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

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
        </section>
      </div>

      {/* Модальное окно для вывода средств */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Вывод средств
            </h2>

            <p className="text-sm text-gray-600 mb-4">
              Доступно для вывода: <span className="font-semibold">{formatAmount(balance)}</span>
            </p>

            <form onSubmit={handleWithdrawSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Сумма для вывода
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={withdrawAmount}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setWithdrawAmount(value);
                    }}
                    placeholder="0 ₽"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                    autoFocus
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                    ₽
                  </span>
                </div>
              </div>

              {submitError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {submitError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !withdrawAmount}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Создание заявки...' : 'Создать заявку'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}