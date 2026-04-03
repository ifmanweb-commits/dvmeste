'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@prisma/client';
import { Wallet, Search, Filter, X, ArrowRight, User as UserIcon } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'PURCHASE' | 'EARNING' | 'ADJUSTMENT';
  amount: number;
  balanceAfter: number;
  description: string;
  paymentId: string | null;
  metadata: any;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    fullName: string | null;
  };
}

interface TransactionsResponse {
  items: Transaction[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

interface PaymentsClientProps {
  user: User;
}

const TRANSACTION_TYPES = [
  { value: '', label: 'Все типы' },
  { value: 'DEPOSIT', label: 'Пополнение' },
  { value: 'WITHDRAWAL', label: 'Вывод средств' },
  { value: 'PURCHASE', label: 'Покупка' },
  { value: 'EARNING', label: 'Начисление' },
  { value: 'ADJUSTMENT', label: 'Корректировка' },
];

export function PaymentsClient({ user }: PaymentsClientProps) {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Фильтры
  const [email, setEmail] = useState('');
  const [type, setType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [searchedUser, setSearchedUser] = useState<{
    id: string;
    email: string;
    fullName: string | null;
    balance: number;
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const limit = 50;

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (email) params.append('email', email);
      if (type) params.append('type', type);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const res = await fetch(`/api/admin/transactions?${params}`);
      if (!res.ok) throw new Error('Ошибка при загрузке транзакций');
      const data: TransactionsResponse = await res.json();
      setTransactions(data.items);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [page, email, type, dateFrom, dateTo]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Поиск пользователя по email (через API с хэшем)
  const handleEmailSearch = async () => {
    if (!email.trim()) {
      setSearchedUser(null);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    setIsSearching(true);
    setSearchedUser(null);

    try {
      const res = await fetch(`/api/admin/users/find?email=${encodeURIComponent(email.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ошибка поиска");
      }

      if (!data.user) {
        setSearchedUser(null);
      } else {
        setSearchedUser({
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.name,
          balance: data.user.balance
        });
      }
    } catch (err: any) {
      console.error('Ошибка поиска пользователя:', err);
      setSearchedUser(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResetFilters = () => {
    setType('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

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

  const handleUserClick = (userId: string) => {
    router.push(`/admin/payments/${userId}`);
  };

  return (
    <div className="">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Платежи</h1>
          <p className="text-gray-500 mt-1">Управление транзакциями и балансами пользователей</p>
        </div>
        <Wallet className="h-8 w-8 text-blue-600" />
      </div>

      {/* Поиск и фильтры */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Поиск по email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailSearch()}
                  placeholder="user@example.com"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleEmailSearch}
                disabled={isSearching || !email.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSearching ? "..." : "Найти"}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Тип операции
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {TRANSACTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дата с
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дата по
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {(type || dateFrom || dateTo) && (
            <div className="flex items-center justify-between pt-2">
              <div className="flex flex-wrap gap-2">
                {type && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded">
                    {TRANSACTION_TYPES.find((t) => t.value === type)?.label}
                    <button type="button" onClick={() => setType('')} className="hover:text-blue-900">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {dateFrom && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded">
                    С: {dateFrom}
                    <button type="button" onClick={() => setDateFrom('')} className="hover:text-blue-900">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {dateTo && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded">
                    По: {dateTo}
                    <button type="button" onClick={() => setDateTo('')} className="hover:text-blue-900">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Сбросить фильтры
              </button>
            </div>
          )}
        </div>

        {/* Кнопка скрытия/показа фильтров - под формой поиска */}
        <div className="pt-4 border-t border-gray-200 mt-4">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
          </button>
        </div>
      </div>

      {/* Карточка найденного пользователя */}
      {searchedUser && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <UserIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {searchedUser.fullName || 'Пользователь'}
                </h3>
                <p className="text-sm text-gray-600">{searchedUser.email}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Баланс: <span className="font-semibold text-gray-900">{formatAmount(searchedUser.balance)}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/admin/payments/${searchedUser.id}`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Перейти к биллингу
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {searchedUser === null && email && hasSearched && !isSearching && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          Пользователь с email "{email}" не найден
        </div>
      )}

      {isSearching && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500">
          Поиск пользователя...
        </div>
      )}

      {/* Таблица транзакций */}
      <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Все транзакции ({total})
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
              Транзакции не найдены
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
                      Пользователь
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleUserClick(transaction.user?.id || '')}
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {transaction.user?.fullName || transaction.user?.email || '—'}
                        </button>
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
    </div>
  );
}