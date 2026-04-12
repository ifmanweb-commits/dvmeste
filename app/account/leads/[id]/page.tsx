"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { LeadStatus, LeadResolution } from "@prisma/client";
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_COLORS,
  LEAD_STATUS_ACTIONS,
  RESOLUTION_LABELS,
  RESOLUTION_COLORS,
  RESOLUTION_OPTIONS,
  LeadAction,
} from "@/lib/lead-status-config";
import { 
  ArrowLeft, 
  AlertTriangle, 
  Mail, 
  Phone, 
  MessageSquare, 
  Calendar, 
  Clock,
  User,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

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
  resolution: LeadResolution | null;
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
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
    yellow: "bg-yellow-100 text-yellow-700",
    red: "bg-red-100 text-red-700",
    gray: "bg-gray-100 text-gray-700",
    purple: "bg-purple-100 text-purple-700",
  };
  return colors[color] || colors.gray;
}

function getButtonVariantClass(variant: string): string {
  const variants: Record<string, string> = {
    success: "bg-green-600 hover:bg-green-700 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    warning: "bg-yellow-600 hover:bg-yellow-700 text-white",
    neutral: "bg-gray-600 hover:bg-gray-700 text-white",
    primary: "bg-[#5858E2] hover:bg-[#4a4ac9] text-white",
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
          <XCircle className="w-5 h-5" />
        </button>

        <h3 className="mb-4 text-lg font-semibold text-gray-900 flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-500" />
          Отказ от заявки
        </h3>

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

// Модалка завершения заявки
function CompleteModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (resolution: LeadResolution) => Promise<void>;
  isLoading: boolean;
}) {
  const [selectedResolution, setSelectedResolution] = useState<LeadResolution | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedResolution(null);
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResolution) {
      setError("Выберите исход заявки");
      return;
    }
    await onSubmit(selectedResolution);
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
          <XCircle className="w-5 h-5" />
        </button>

        <h3 className="mb-4 text-lg font-semibold text-gray-900 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          Завершение заявки
        </h3>
        <p className="text-sm text-gray-600 mb-4">Выберите исход этой заявки:</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            {RESOLUTION_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedResolution === option.value
                    ? "border-[#5858E2] bg-[#5858E2]/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="resolution"
                  value={option.value}
                  checked={selectedResolution === option.value}
                  onChange={(e) => setSelectedResolution(e.target.value as LeadResolution)}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-sm text-gray-900">{option.label}</p>
                  <p className="text-xs text-gray-500">{option.description}</p>
                </div>
              </label>
            ))}
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
              className="flex-1 rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white hover:bg-[#4d4dd0] disabled:opacity-50"
            >
              {isLoading ? "Сохранение..." : "Завершить"}
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
          <XCircle className="w-5 h-5" />
        </button>

        <h3 className="mb-4 text-lg font-semibold text-gray-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Пожаловаться на клиента
        </h3>

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
              className="flex-1 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
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
  const [showCompleteModal, setShowCompleteModal] = useState(false);
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
    if (action.id === "reject") {
      setShowRejectModal(true);
      return;
    }

    if (action.id === "complete") {
      setShowCompleteModal(true);
      return;
    }

    if (action.id === "accept") {
      setActionLoading("accept");
      try {
        const response = await fetch(`/api/leads/${leadId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "accept",
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
          action: "reject",
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

  // Обработка завершения
  const handleComplete = async (resolution: LeadResolution) => {
    setActionLoading("complete");
    try {
      const response = await fetch(`/api/leads/${leadId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          resolution,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setShowCompleteModal(false);
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
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
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
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-4">
            {error || "Заявка не найдена"}
          </div>
          <button
            onClick={() => router.push("/account/leads")}
            className="text-[#5858E2] hover:underline text-sm font-medium cursor-pointer"
          >
            ← Вернуться к списку
          </button>
        </div>
      </div>
    );
  }

  const actions = LEAD_STATUS_ACTIONS[lead.status] || [];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Заголовок страницы */}
        <header className="mb-8">
          <button
            onClick={() => router.push("/account/leads")}
            className="cursor-pointer mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#5858E2] hover:text-[#4a4ac9] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Вернуться к списку
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Заявка от {lead.client.name || "Анонима"}</h1>
              <p className="text-gray-600 mt-1">Детальная информация о заявке</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold ${getStatusColorClass(LEAD_STATUS_COLORS[lead.status])}`}>
                {LEAD_STATUS_LABELS[lead.status]}
              </span>
              {lead.resolution && (
                <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold ${getStatusColorClass(RESOLUTION_COLORS[lead.resolution])}`}>
                  {RESOLUTION_LABELS[lead.resolution]}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Предупреждение о подозрительном клиенте */}
        {lead.isSuspicious && (
          <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold text-sm">Подозрительный клиент</p>
              <p className="text-sm">
                На этого клиента жаловались {lead.client.complaintCount} раз. Будьте осторожны при общении.
              </p>
            </div>
          </div>
        )}

        {/* Основная информация */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg text-indigo-600">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Информация о клиенте</h2>
                <p className="text-xs text-gray-500">Персональные данные и контакты</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Имя</p>
                <p className="text-base font-semibold text-gray-900">{lead.client.name || "Не указано"}</p>
              </div>
              
              {/* Контакты показываем только если заявка принята (ACCEPTED) */}
              {lead.status === LeadStatus.ACCEPTED ? (
                <>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email</p>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <p className="text-base font-medium text-gray-900">{lead.client.email}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Телефон</p>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <p className="text-base font-medium text-gray-900">{lead.client.phone || "Не указано"}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Telegram / VK</p>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-gray-400" />
                      <p className="text-base font-medium text-gray-900">{lead.client.telegram || lead.client.vk || "Не указано"}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="md:col-span-2">
                  <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-sm">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
                      <div>
                        <p className="font-semibold mb-1">Контакты скрыты</p>
                        <p className="text-blue-700">
                          Контакты клиента будут доступны, если вы примете заявку. Нажмите кнопку «Принять» в разделе действий, чтобы связаться с клиентом.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Дата создания</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(lead.createdAt).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Clock className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Время создания</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(lead.createdAt).toLocaleTimeString("ru-RU", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {lead.statusChangedAt && (
              <div className="mt-4 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Clock className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Дата изменения статуса</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(lead.statusChangedAt).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Сообщение клиента */}
        {lead.message && (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg text-purple-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Сообщение клиента</h2>
                  <p className="text-xs text-gray-500">Текст обращения</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{lead.message}</p>
            </div>
          </div>
        )}

        {/* Кнопки действий */}
        {actions.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg text-amber-600">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Действия</h2>
                  <p className="text-xs text-gray-500">Управление статусом заявки</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-wrap gap-3">
                {actions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action)}
                    disabled={actionLoading !== null}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${getButtonVariantClass(action.variant)}`}
                  >
                    {action.icon && <span>{action.icon}</span>}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Кнопка жалобы */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="p-6">
            <button
              onClick={() => setShowComplaintModal(true)}
              disabled={actionLoading !== null}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              Пожаловаться на клиента
            </button>
          </div>
        </div>
      </div>

      {/* Модалки */}
      <RejectModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onSubmit={handleReject}
        isLoading={actionLoading === "reject"}
      />

      <CompleteModal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        onSubmit={handleComplete}
        isLoading={actionLoading === "complete"}
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