"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { LeadStatus } from "@prisma/client";
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_COLORS,
  LEAD_STATUS_ACTIONS,
  LeadAction,
} from "@/lib/lead-status-config";

interface Lead {
  id: string;
  client: {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    telegram: string | null;
    vk: string | null;
    complaintCount: number;
  };
  message: string | null;
  status: LeadStatus;
  isSuspicious: boolean;
  suspiciousReason: string | null;
  createdAt: string;
  viewedAt: string | null;
  statusChangedAt: string | null;
}

interface LeadResponse {
  success: boolean;
  lead?: Lead;
  error?: string;
}

function getStatusColorClass(color: string): string {
  const colors: Record<string, string> = {
    green: "bg-green-100 text-green-800",
    blue: "bg-blue-100 text-blue-800",
    yellow: "bg-yellow-100 text-yellow-800",
    red: "bg-red-100 text-red-800",
    gray: "bg-gray-100 text-gray-800",
    purple: "bg-purple-100 text-purple-800",
  };
  return colors[color] || colors.gray;
}

function getButtonVariantClass(variant: string): string {
  const variants: Record<string, string> = {
    success: "bg-green-600 hover:bg-green-700 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    warning: "bg-yellow-600 hover:bg-yellow-700 text-white",
    neutral: "bg-gray-200 hover:bg-gray-300 text-gray-800",
  };
  return variants[variant] || variants.neutral;
}

// Модалка отказа
function RejectModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (clientReason: string, internalReason: string) => Promise<void>;
  isLoading: boolean;
}) {
  const [clientReason, setClientReason] = useState("");
  const [internalReason, setInternalReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setClientReason("");
      setInternalReason("");
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientReason.trim()) {
      setError("Причина для клиента обязательна");
      return;
    }
    await onSubmit(clientReason, internalReason);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 disabled:opacity-50"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="mb-4 text-lg font-semibold text-gray-900">Отказ от заявки</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="clientReason" className="block text-sm font-medium text-gray-700">
              Причина для клиента <span className="text-red-500">*</span>
            </label>
            <textarea
              id="clientReason"
              value={clientReason}
              onChange={(e) => setClientReason(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
              placeholder="Напишите причину, которую увидит клиент"
            />
          </div>

          <div>
            <label htmlFor="internalReason" className="block text-sm font-medium text-gray-700">
              Внутренняя заметка
            </label>
            <textarea
              id="internalReason"
              value={internalReason}
              onChange={(e) => setInternalReason(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
              placeholder="Для себя (не будет показано клиенту)"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? "Отправка..." : "Отказаться"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Модалка жалобы
function ComplaintModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  clientId,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, description: string) => Promise<void>;
  isLoading: boolean;
  clientId: string;
}) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const reasons = [
    { value: "spam", label: "Спам" },
    { value: "rude", label: "Хамство" },
    { value: "inadequate", label: "Неадекватное поведение" },
    { value: "other", label: "Другое" },
  ];

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setDescription("");
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setError("Выберите причину жалобы");
      return;
    }
    if (!description.trim()) {
      setError("Описание обязательно");
      return;
    }
    await onSubmit(reason, description);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 disabled:opacity-50"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="mb-4 text-lg font-semibold text-gray-900">Пожаловаться на клиента</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
              Причина <span className="text-red-500">*</span>
            </label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
            >
              <option value="">Выберите причину</option>
              {reasons.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Описание <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
              placeholder="Опишите ситуацию подробно"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
            >
              {isLoading ? "Отправка..." : "Отправить жалобу"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Модалки
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);

  // Загрузка данных заявки
  const fetchLead = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/leads/${leadId}`);
      const data: LeadResponse = await response.json();

      if (data.success && data.lead) {
        setLead(data.lead);
      } else {
        setError(data.error || "Ошибка при загрузке заявки");
      }
    } catch (err) {
      setError("Ошибка при загрузке заявки");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  // Обработка действия со статусом
  const handleAction = async (action: LeadAction) => {
    if (action.status === LeadStatus.REJECTED) {
      setShowRejectModal(true);
      return;
    }

    setActionLoading(action.id);
    try {
      const response = await fetch(`/api/leads/${leadId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: action.status,
        }),
      });

      const result = await response.json();

      if (result.success) {
        fetchLead();
      } else {
        alert(result.error || "Ошибка при обновлении статуса");
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка при обновлении статуса");
    } finally {
      setActionLoading(null);
    }
  };

  // Обработка отказа
  const handleReject = async (clientReason: string, internalReason: string) => {
    setActionLoading("reject");
    try {
      const response = await fetch(`/api/leads/${leadId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: LeadStatus.REJECTED,
          clientReason,
          internalReason,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setShowRejectModal(false);
        fetchLead();
      } else {
        alert(result.error || "Ошибка при обновлении статуса");
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка при обновлении статуса");
    } finally {
      setActionLoading(null);
    }
  };

  // Обработка жалобы
  const handleComplaint = async (reason: string, description: string) => {
    if (!lead) return;

    setActionLoading("complaint");
    try {
      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromType: "psychologist",
          toType: "client",
          toId: lead.client.id,
          reason,
          description,
          leadId: lead.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setShowComplaintModal(false);
        alert("Жалоба отправлена");
        fetchLead();
      } else {
        alert(result.error || "Ошибка при отправке жалобы");
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка при отправке жалобы");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/30">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="flex justify-center items-center py-12">
            <svg className="animate-spin h-8 w-8 text-[#5858E2]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="min-h-screen bg-slate-50/30">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error || "Заявка не найдена"}
          </div>
          <button
            onClick={() => router.push("/account/leads")}
            className="mt-4 text-[#5858E2] hover:underline"
          >
            ← Вернуться к списку
          </button>
        </div>
      </div>
    );
  }

  const actions = LEAD_STATUS_ACTIONS[lead.status] || [];

  return (
    <div className="min-h-screen bg-slate-50/30">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Хедер */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/account/leads")}
            className="mb-4 text-[#5858E2] hover:underline"
          >
            ← Вернуться к списку
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Заявка #{lead.id.slice(-6)}</h1>
        </div>

        {/* Предупреждение о подозрительном клиенте */}
        {lead.isSuspicious && (
          <div className="mb-6 flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-yellow-800">
            <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>
              На этого клиента жаловались {lead.client.complaintCount} раз. Будьте осторожны
            </span>
          </div>
        )}

        {/* Основная информация */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Информация о клиенте</h2>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColorClass(
                LEAD_STATUS_COLORS[lead.status]
              )}`}
            >
              {LEAD_STATUS_LABELS[lead.status]}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Имя</p>
              <p className="font-medium">{lead.client.name || "Не указано"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{lead.client.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Телефон</p>
              <p className="font-medium">{lead.client.phone || "Не указано"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Telegram / VK</p>
              <p className="font-medium">{lead.client.telegram || lead.client.vk || "Не указано"}</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Дата создания</p>
            <p className="font-medium">
              {new Date(lead.createdAt).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {lead.statusChangedAt && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Дата изменения статуса</p>
              <p className="font-medium">
                {new Date(lead.statusChangedAt).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}
        </div>

        {/* Сообщение клиента */}
        {lead.message && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Сообщение клиента</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{lead.message}</p>
          </div>
        )}

        {/* Кнопки действий */}
        {actions.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Действия</h2>
            <div className="flex flex-wrap gap-3">
              {actions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleAction(action)}
                  disabled={actionLoading !== null}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${getButtonVariantClass(
                    action.variant
                  )} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {action.icon && <span>{action.icon}</span>}
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Кнопка жалобы */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <button
            onClick={() => setShowComplaintModal(true)}
            disabled={actionLoading !== null}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>⚠️</span>
            Пожаловаться на клиента
          </button>
        </div>
      </div>

      {/* Модалки */}
      <RejectModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onSubmit={handleReject}
        isLoading={actionLoading === "reject"}
      />

      <ComplaintModal
        isOpen={showComplaintModal}
        onClose={() => setShowComplaintModal(false)}
        onSubmit={handleComplaint}
        isLoading={actionLoading === "complaint"}
        clientId={lead.client.id}
      />
    </div>
  );
}