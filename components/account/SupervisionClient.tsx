"use client";

import { use, useEffect, useState } from "react";
import { ShieldCheck, Inbox, Clock, History, CheckCircle, XCircle, MinusCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface Submission {
  id: string;
  challengeId: string;
  userId: string;
  videoUrl: string;
  transcriptUrl: string;
  status: "SUBMITTED" | "REVIEWING" | "APPROVED" | "REJECTED";
  approvedCount: number;
  rejectedCount: number;
  submittedAt: Date;
  reviewerId: string | null;
  challenge: {
    id: string;
    title: string;
    description: string | null;
    price: number | null;
    work: {
      instructions: string | null;
      requiredReviews: number;
      reviewsToPass: number;
    } | null;
  };
  user: {
    id: string;
    fullName: string | null;
    email: string;
  };
}

export interface ReviewHistory {
  id: string;
  submissionId: string;
  verdict: "APPROVED" | "REJECTED" | null;
  status: "TAKEN" | "COMPLETED" | "CANCELLED";
  comment: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
  challenge: {
    id: string;
    title: string;
  };
  psychologist: {
    id: string;
    fullName: string | null;
  };
}

type Tab = "available" | "reviewing" | "history";

interface SupervisionClientProps {
  searchParams: Promise<{ tab?: string }>;
  availableSubmissions: Submission[];
  reviewingSubmissions: Submission[];
}

const VALID_TABS = ['available', 'reviewing', 'history'] as const;

function validateTab(tab?: string): Tab {
  if (!tab || !VALID_TABS.includes(tab as Tab)) {
    return 'available';
  }
  return tab as Tab;
}

export default function SupervisionClient({
  searchParams,
  availableSubmissions: initialAvailable,
  reviewingSubmissions: initialReviewing,
}: SupervisionClientProps) {
  const params = use(searchParams);
  const activeTab = validateTab(params.tab);
  
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Данные для первых двух вкладок — из пропсов (загружены на сервере)
  const [availableSubmissions, setAvailableSubmissions] = useState<Submission[]>(initialAvailable);
  const [reviewingSubmissions, setReviewingSubmissions] = useState<Submission[]>(initialReviewing);
  
  // История — загружается при переходе на вкладку
  const [reviewHistory, setReviewHistory] = useState<ReviewHistory[]>([]);

  // Загрузка истории при переходе на вкладку history
  useEffect(() => {
    if (activeTab === 'history') {
      setLoading(true);
      setError(null);

      const fetchHistory = async () => {
        try {
          const res = await fetch('/api/supervision/history');
          if (!res.ok) throw new Error('Ошибка загрузки истории');
          const data = await res.json();
          setReviewHistory(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
        } finally {
          setLoading(false);
        }
      };

      fetchHistory();
    }
  }, [activeTab]);

  const handleTake = async (submissionId: string) => {
    setActionLoading(submissionId);
    try {
      const res = await fetch(`/api/supervision/submissions/${submissionId}/take`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      
      // Обновляем списки: убираем из доступных, добавляем в на проверке
      setAvailableSubmissions(prev => prev.filter(s => s.id !== submissionId));
      const resReviewing = await fetch('/api/supervision/submissions?tab=reviewing');
      const reviewingData = await resReviewing.json();
      setReviewingSubmissions(reviewingData);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка при взятии работы");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (submissionId: string) => {
    if (!confirm("Отказаться от проверки? Работа вернётся в общий пул.")) return;
    
    setActionLoading(submissionId);
    try {
      const res = await fetch(`/api/supervision/submissions/${submissionId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      
      // Перезагружаем обе вкладки
      const resAvailable = await fetch('/api/supervision/submissions?tab=available');
      const availableData = await resAvailable.json();
      setAvailableSubmissions(availableData);
      
      const resReviewing = await fetch('/api/supervision/submissions?tab=reviewing');
      const reviewingData = await resReviewing.json();
      setReviewingSubmissions(reviewingData);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка при отказе");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Супервизия</h1>
              <p className="text-gray-600 text-sm">Панель супервизора</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <Link
                href="/account/supervision?tab=available"
                className={cn(
                  "flex-1 px-6 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative",
                  activeTab === "available"
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <Inbox className="w-4 h-4" />
                Доступные
                {availableSubmissions.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                    {availableSubmissions.length}
                  </span>
                )}
                {activeTab === "available" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
              </Link>
              <Link
                href="/account/supervision?tab=reviewing"
                className={cn(
                  "flex-1 px-6 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative",
                  activeTab === "reviewing"
                    ? "bg-amber-50 text-amber-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <Clock className="w-4 h-4" />
                На проверке
                {reviewingSubmissions.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">
                    {reviewingSubmissions.length}
                  </span>
                )}
                {activeTab === "reviewing" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600" />}
              </Link>
              <Link
                href="/account/supervision?tab=history"
                className={cn(
                  "flex-1 px-6 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative",
                  activeTab === "history"
                    ? "bg-green-50 text-green-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <History className="w-4 h-4" />
                История
                {activeTab === "history" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600" />}
              </Link>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-600">{error}</div>
            ) : activeTab === "available" ? (
              <AvailableTab
                submissions={availableSubmissions}
                onTake={handleTake}
                loading={actionLoading}
              />
            ) : activeTab === "reviewing" ? (
              <ReviewingTab
                submissions={reviewingSubmissions}
                onCancel={handleCancel}
                loading={actionLoading}
              />
            ) : (
              <HistoryTab reviews={reviewHistory} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AvailableTab({
  submissions,
  onTake,
  loading,
}: {
  submissions: Submission[];
  onTake: (id: string) => void;
  loading: string | null;
}) {
  if (submissions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Inbox className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Нет доступных работ для проверки</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {submissions.map((s) => (
        <div
          key={s.id}
          className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors flex flex-col"
        >
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{s.challenge.title}</h3>
            <p className="text-xs text-gray-500 mt-2">
              {new Date(s.submittedAt).toLocaleDateString("ru-RU")}
            </p>
          </div>
          <div className="flex items-center justify-between gap-2 mt-4">
            {s.challenge.price && s.challenge.price > 0 && (
              <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded">
                +{(s.challenge.price / 100).toLocaleString("ru-RU")} ₽
              </span>
            )}
            <button
              onClick={() => onTake(s.id)}
              disabled={loading === s.id}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {loading === s.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Взять
                </>
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReviewingTab({
  submissions,
  onCancel,
  loading,
}: {
  submissions: Submission[];
  onCancel: (id: string) => void;
  loading: string | null;
}) {
  if (submissions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Нет работ на проверке</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {submissions.map((s) => (
        <div
          key={s.id}
          className="border border-amber-200 bg-amber-50 rounded-lg p-4 flex flex-col"
        >
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{s.challenge.title}</h3>
            <p className="text-xs text-gray-500 mt-2">
              {new Date(s.submittedAt).toLocaleDateString("ru-RU")}
            </p>
          </div>
          <div className="flex flex-col gap-2 mt-4">
            <Link
              href={`/account/supervision/${s.id}`}
              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors text-center flex items-center justify-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Проверить
            </Link>
            <button
              onClick={() => onCancel(s.id)}
              disabled={loading === s.id}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {loading === s.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <MinusCircle className="w-3.5 h-3.5" />
                  Отказаться
                </>
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function HistoryTab({ reviews }: { reviews: ReviewHistory[] }) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>История проверок пуста</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <div
          key={r.id}
          className={`border rounded-lg p-4 ${
            r.status === "CANCELLED"
              ? "border-gray-200 bg-gray-50"
              : r.verdict === "APPROVED"
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">{r.challenge.title}</h3>
                {r.status === "CANCELLED" ? (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">
                    Отказ
                  </span>
                ) : r.verdict === "APPROVED" ? (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Одобрено
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    Отклонено
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Психолог: {r.psychologist.fullName || "Аноним"}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Завершено: {r.resolvedAt ? new Date(r.resolvedAt).toLocaleDateString("ru-RU") : "-"}
              </p>
              {r.comment && (
                <div className="mt-3 p-3 bg-white rounded text-sm text-gray-700">
                  <strong>Комментарий:</strong>
                  <p className="mt-1">{r.comment}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}