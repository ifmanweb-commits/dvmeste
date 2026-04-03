'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@prisma/client';
import { Wallet, ArrowLeft, AlertCircle } from 'lucide-react';

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

interface UserStats {
  totalDeposits: number;
  totalWithdrawals: number;
  transactionCount: number;
}

interface UserBillingClientProps {
  user: {
    id: string;
    email: string;
    fullName: string | null;
    balance: number;
    createdAt: Date;
  };
  stats: UserStats;
}

export function UserBillingClient({ user, stats }: UserBillingClientProps) {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Форма корректировки
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentDescription, setAdjustmentDescription] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustmentMessage, setAdjustmentMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const limit = 50;

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      const res = await fetch(`/api/admin/transactions/user-transactions?${params}&userId=${user.id}`);
      if (!res.ok) throw new Error('Ошибка при загрузке транзакций');
      const data: TransactionsResponse = await res.json();
      setTransactions(data.items);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [page, user.id]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

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

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const confirmAdjustment = async () => {
    setShowConfirmModal(false);
    setIsAdjusting(true);
    setAdjustmentMessage(null);

    try {
      const amount = parseFloat(adjustmentAmount);
      if (isNaN(amount) || amount === 0) {
        setAdjustmentMessage({ type: 'error', text: 'Сумма должна быть не нулевой' });
        setIsAdjusting(false);
        return;
      }

      const res = await fetch('/api/admin/transactions/adjustment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          amount, // в рублях
          description: adjustmentDescription,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setAdjustmentMessage({ type: 'success', text: `Баланс успешно изменён. Новый баланс: ${formatAmount(data.newBalance)}` });
        setAdjustmentAmount('');
        setAdjustmentDescription('');
        setPage(1);
        fetchTransactions();
      } else {
        setAdjustmentMessage({ type: 'error', text: data.error || 'Ошибка при корректировке' });
      }
    } catch (err: any) {
      setAdjustmentMessage({ type: 'error', text: 'Ошибка соединения с сервером' });
    } finally {
      setIsAdjusting(false);
    }
  };

  const formatRubles = (kopecks: number): string => {
    return Math.round(kopecks / 100).toLocaleString('ru-RU');
  };

  return (
    <div className="space-y-6">
      {/* Заголовок с кнопкой назад */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/admin/payments')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Биллинг пользователя</h1>
          <p className="text-sm text-gray-500 mt-1">Управление балансом и историей операций</p>
        </div>
      </div>

      {/* Информация о пользователе */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Пользователь</p>
            <p className="font-medium text-gray-900">{user.fullName || '—'}</p>
            <p className="text-sm text-gray-600">{user.email}</p>
            <p className="text-xs text-gray-400 mt-1">ID: {user.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Текущий баланс</p>
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-green-600" />
              <p className="text-2xl font-bold text-gray-900">{formatRubles(user.balance)} ₽</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Всего пополнений</p>
            <p className="text-xl font-semibold text-green-600">+{formatRubles(stats.totalDeposits)} ₽</p>
            <p className="text-xs text-gray-400 mt-1">{stats.transactionCount} операций</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Всего списаний</p>
            <p className="text-xl font-semibold text-red-600">-{formatRubles(stats.totalWithdrawals)} ₽</p>
          </div>
        </div>
      </div>

      {/* Форма корректировки баланса */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Корректировка баланса</h2>
        <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Сумма (₽)
              </label>
              <input
                type="number"
                step="1"
                value={adjustmentAmount}
                onChange={(e) => setAdjustmentAmount(e.target.value)}
                placeholder="Положительное - пополнение, отрицательное - списание"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Положительное число увеличит баланс, отрицательное — уменьшит
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Комментарий
              </label>
              <input
                type="text"
                value={adjustmentDescription}
                onChange={(e) => setAdjustmentDescription(e.target.value)}
                placeholder="Причина корректировки"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={isAdjusting || !adjustmentAmount || !adjustmentDescription}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAdjusting ? 'Обработка...' : 'Применить корректировку'}
            </button>
            {adjustmentMessage && (
              <span className={`text-sm ${adjustmentMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {adjustmentMessage.text}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* История транзакций */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            История операций ({total})
          </h2>
        </div>

        {error && (
          <div className="p-6">
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          </div>
        )}

        {!error && transactions.length === 0 && !isLoading && (
          <div className="p-6">
            <p className="text-center text-sm text-gray-500">
              История операций пуста
            </p>
          </div>
        )}

        {isLoading && (
          <div className="p-6">
            <p className="text-center text-sm text-gray-500">Загрузка...</p>
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
                        {formatAmount(transaction.amount)}
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
                Страница {page} из {Math.ceil(total / limit)} ({total} записей)
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(total / limit)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Вперёд →
              </button>
            </div>
          </>
        )}
      </div>

      {/* Модальное окно подтверждения */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-amber-600" />
              <h3 className="text-lg font-semibold text-gray-900">Подтверждение корректировки</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Вы собираетесь изменить баланс пользователя <strong>{user.fullName || user.email}</strong> на <strong>{adjustmentAmount} ₽</strong>.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Комментарий: {adjustmentDescription}
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmAdjustment}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Подтвердить
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}