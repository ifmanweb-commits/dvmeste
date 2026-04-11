'use client';

import { useState, useEffect, useCallback } from 'react';
import { User } from '@prisma/client';
import { Wallet, CheckCircle, Clock, XCircle, X } from 'lucide-react';

interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  moderatorId: string | null;
  processedAt: Date | null;
  createdAt: Date;
  user?: {
    id: string;
    email: string;
    fullName: string | null;
  };
  moderator?: {
    id: string;
    email: string;
    fullName: string | null;
  } | null;
}

interface WithdrawalRequestsClientProps {
  user: User;
}

export function WithdrawalRequestsClient({ user }: WithdrawalRequestsClientProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);

  const limit = 50;

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        tab: activeTab,
      });

      const res = await fetch(`/api/admin/withdrawal-requests?${params}`);
      if (!res.ok) throw new Error('Ошибка при загрузке заявок');
      const data = await res.json();
      
      setRequests(data.items);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [page, activeTab]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleProcessRequest = async (request: WithdrawalRequest) => {
    setSelectedRequest(request);
    setIsConfirmModalOpen(true);
  };

  const confirmProcessRequest = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedRequest) return;

    setProcessingId(selectedRequest.id);
    setIsConfirmModalOpen(false);
    try {
      const res = await fetch(`/api/admin/withdrawal-requests/${selectedRequest.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Ошибка при обработке');
      }

      // Обновляем список
      fetchRequests();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingId(null);
      setSelectedRequest(null);
    }
  };

  const formatAmount = (amountInKopecks: number): string => {
    const rubles = Math.round(amountInKopecks / 100);
    return rubles.toLocaleString('ru-RU') + ' ₽';
  };

  const formatDate = (dateString: Date): string => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusLabel = (status: WithdrawalRequest['status']): string => {
    const labels: Record<WithdrawalRequest['status'], string> = {
      PENDING: 'Ожидает обработки',
      APPROVED: 'Обработана',
      REJECTED: 'Отклонена',
    };
    return labels[status];
  };

  const getStatusIcon = (status: WithdrawalRequest['status']) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'APPROVED':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Заявки на вывод</h1>
          <p className="text-gray-500 mt-1">Управление заявками на вывод средств</p>
        </div>
        <Wallet className="h-8 w-8 text-blue-600" />
      </div>

      {/* Вкладки */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex gap-4">
          <button
            onClick={() => {
              setActiveTab('pending');
              setPage(1);
            }}
            className={`pb-3 px-1 font-medium text-sm transition-colors ${
              activeTab === 'pending'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Активные заявки
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              setPage(1);
            }}
            className={`pb-3 px-1 font-medium text-sm transition-colors ${
              activeTab === 'history'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            История
          </button>
        </nav>
      </div>

      {/* Контент */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500">
          Загрузка...
        </div>
      )}

      {!isLoading && requests.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500">
          {activeTab === 'pending' 
            ? 'Нет активных заявок' 
            : 'История пуста'}
        </div>
      )}

      {!isLoading && requests.length > 0 && activeTab === 'pending' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm text-gray-500">
                    {request.user?.fullName || request.user?.email || 'Пользователь'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(request.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full text-xs font-medium">
                  <Clock className="h-3 w-3" />
                  {getStatusLabel(request.status)}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-2xl font-bold text-gray-900">
                  {formatAmount(request.amount)}
                </p>
              </div>

              <button
                onClick={() => handleProcessRequest(request)}
                disabled={processingId === request.id}
                className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium flex items-center justify-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Выведено
              </button>
            </div>
          ))}
        </div>
      )}

      {!isLoading && requests.length > 0 && activeTab === 'history' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">
                  Дата и время
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">
                  Супервизор
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">
                  Модератор
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">
                  Сумма
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">
                  Статус
                </th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr
                  key={request.id}
                  className="border-t border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-gray-600">
                    {request.processedAt ? formatDate(request.processedAt) : formatDate(request.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {request.user?.fullName || request.user?.email || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {request.moderator?.fullName || request.moderator?.email || '—'}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {formatAmount(request.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(request.status)}
                      <span className={
                        request.status === 'APPROVED' ? 'text-green-600' :
                        request.status === 'REJECTED' ? 'text-red-600' :
                        'text-yellow-600'
                      }>
                        {getStatusLabel(request.status)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 mt-6 bg-white rounded-lg border">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Назад
          </button>
          <span className="text-sm text-gray-600">
            Страница {page} из {totalPages} ({total} записей)
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Вперёд →
          </button>
        </div>
      )}

      {/* Модальное окно подтверждения */}
      {isConfirmModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => {
              setIsConfirmModalOpen(false);
              setSelectedRequest(null);
            }}
          />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
            <button
              onClick={() => {
                setIsConfirmModalOpen(false);
                setSelectedRequest(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Подтверждение вывода
              </h2>
              <p className="text-sm text-gray-600">
                Вы подтверждаете, что деньги были выведены супервизору?
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Пользователь</span>
                  <span className="font-medium text-gray-900">
                    {selectedRequest.user?.fullName || selectedRequest.user?.email || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Сумма</span>
                  <span className="font-bold text-gray-900">
                    {formatAmount(selectedRequest.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Дата создания</span>
                  <span className="text-gray-700">
                    {formatDate(selectedRequest.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  setSelectedRequest(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => confirmProcessRequest('APPROVED')}
                disabled={processingId === selectedRequest.id}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
              >
                {processingId === selectedRequest.id ? 'Обработка...' : 'Подтвердить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
