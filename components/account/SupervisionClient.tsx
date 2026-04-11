"use client";

import { use, useEffect, useState } from "react";
import { ShieldCheck, Inbox, Clock, History, CheckCircle, XCircle, MinusCircle, Loader2, ClipboardList, FileBadge, FileText } from "lucide-react";
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

export interface QuestionnaireSubmission {
  id: string;
  challengeId: string;
  userId: string;
  answers: any;
  status: "SUBMITTED" | "REVIEWING" | "APPROVED" | "REJECTED";
  submittedAt: Date;
  reviewerId: string | null;
  challenge: {
    id: string;
    title: string;
    description: string | null;
    price: number | null;
    questionnaire: {
      timeLimit: number | null;
      questionsPool: any;
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
  type: 'WORK' | 'QUESTIONNAIRE';
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
  earning: number;
}

type Tab = "available" | "questionnaires" | "reviewing" | "history";

interface SupervisionClientProps {
  searchParams: Promise<{ tab?: string }>;
  availableSubmissions: Submission[];
  reviewingSubmissions: Submission[];
  availableQuestionnaires: QuestionnaireSubmission[];
  reviewingQuestionnaires: QuestionnaireSubmission[];
}

const VALID_TABS = ['available', 'questionnaires', 'reviewing', 'history'] as const;

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
  availableQuestionnaires: initialAvailableQuestionnaires = [],
  reviewingQuestionnaires: initialReviewingQuestionnaires = [],
}: SupervisionClientProps) {
  const params = use(searchParams);
  const activeTab = validateTab(params.tab);
  
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Данные для первых двух вкладок — из пропсов (загружены на сервере)
  const [availableSubmissions, setAvailableSubmissions] = useState<Submission[]>(initialAvailable);
  const [reviewingSubmissions, setReviewingSubmissions] = useState<Submission[]>(initialReviewing);
  const [availableQuestionnaires, setAvailableQuestionnaires] = useState<QuestionnaireSubmission[]>(initialAvailableQuestionnaires);
  const [reviewingQuestionnaires, setReviewingQuestionnaires] = useState<QuestionnaireSubmission[]>(initialReviewingQuestionnaires);
  
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

  const handleTake = async (submissionId: string, isQuestionnaire: boolean = false) => {
    setActionLoading(submissionId);
    try {
      const endpoint = isQuestionnaire 
        ? `/api/supervision/questionnaires/${submissionId}/take`
        : `/api/supervision/submissions/${submissionId}/take`;
      
      const res = await fetch(endpoint, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      
      // Обновляем списки: убираем из доступных, добавляем в на проверке
      if (isQuestionnaire) {
        setAvailableQuestionnaires(prev => prev.filter(s => s.id !== submissionId));
        const resReviewing = await fetch('/api/supervision/questionnaires?tab=reviewing');
        const reviewingData = await resReviewing.json();
        setReviewingQuestionnaires(reviewingData);
      } else {
        setAvailableSubmissions(prev => prev.filter(s => s.id !== submissionId));
        const resReviewing = await fetch('/api/supervision/submissions?tab=reviewing');
        const reviewingData = await resReviewing.json();
        setReviewingSubmissions(reviewingData);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка при взятии работы");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (submissionId: string, isQuestionnaire: boolean = false) => {
    if (!confirm("Отказаться от проверки? Работа вернётся в общий пул.")) return;
    
    setActionLoading(submissionId);
    try {
      const endpoint = isQuestionnaire
        ? `/api/supervision/questionnaires/${submissionId}/cancel`
        : `/api/supervision/submissions/${submissionId}/cancel`;
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      
      // Перезагружаем обе вкладки
      if (isQuestionnaire) {
        const resAvailable = await fetch('/api/supervision/questionnaires?tab=available');
        const availableData = await resAvailable.json();
        setAvailableQuestionnaires(availableData);
        
        const resReviewing = await fetch('/api/supervision/questionnaires?tab=reviewing');
        const reviewingData = await resReviewing.json();
        setReviewingQuestionnaires(reviewingData);
      } else {
        const resAvailable = await fetch('/api/supervision/submissions?tab=available');
        const availableData = await resAvailable.json();
        setAvailableSubmissions(availableData);
        
        const resReviewing = await fetch('/api/supervision/submissions?tab=reviewing');
        const reviewingData = await resReviewing.json();
        setReviewingSubmissions(reviewingData);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка при отказе");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Супервизия</h1>
              <p className="text-gray-600 text-sm">Панель супервизора</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </header>

        {/* Tabs */}
        <nav className="mb-8 border-b border-gray-200">
          <ul className="flex gap-6">
            <li>
              <Link
                href="/account/supervision?tab=available"
                className={cn(
                  "inline-flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors",
                  activeTab === "available"
                    ? "border-[#5858E2] text-[#5858E2]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                <Inbox className="w-4 h-4" />
                Работы
                {availableSubmissions.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                    {availableSubmissions.length}
                  </span>
                )}
              </Link>
            </li>
            <li>
              <Link
                href="/account/supervision?tab=questionnaires"
                className={cn(
                  "inline-flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors",
                  activeTab === "questionnaires"
                    ? "border-[#5858E2] text-[#5858E2]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                <ClipboardList className="w-4 h-4" />
                Вопросники
                {availableQuestionnaires.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                    {availableQuestionnaires.length}
                  </span>
                )}
              </Link>
            </li>
            <li>
              <Link
                href="/account/supervision?tab=reviewing"
                className={cn(
                  "inline-flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors",
                  activeTab === "reviewing"
                    ? "border-[#5858E2] text-[#5858E2]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                <Clock className="w-4 h-4" />
                В работе
                {(reviewingSubmissions.length + reviewingQuestionnaires.length) > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">
                    {reviewingSubmissions.length + reviewingQuestionnaires.length}
                  </span>
                )}
              </Link>
            </li>
            <li>
              <Link
                href="/account/supervision?tab=history"
                className={cn(
                  "inline-flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors",
                  activeTab === "history"
                    ? "border-[#5858E2] text-[#5858E2]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                <History className="w-4 h-4" />
                История
              </Link>
            </li>
          </ul>
        </nav>

        {/* Content */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
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
          ) : activeTab === "questionnaires" ? (
            <AvailableQuestionnairesTab
              questionnaires={availableQuestionnaires}
              onTake={(id) => handleTake(id, true)}
              loading={actionLoading}
            />
          ) : activeTab === "reviewing" ? (
            <ReviewingTab
              submissions={reviewingSubmissions}
              questionnaires={reviewingQuestionnaires}
              onCancel={handleCancel}
              loading={actionLoading}
            />
          ) : (
            <HistoryTab reviews={reviewHistory} />
          )}
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
  onTake: (id: string, isQuestionnaire?: boolean) => void;
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
              onClick={() => onTake(s.id, false)}
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

function AvailableQuestionnairesTab({
  questionnaires,
  onTake,
  loading,
}: {
  questionnaires: QuestionnaireSubmission[];
  onTake: (id: string) => void;
  loading: string | null;
}) {
  if (questionnaires.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Нет доступных вопросников для проверки</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {questionnaires.map((q) => (
        <div
          key={q.id}
          className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors flex flex-col"
        >
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{q.challenge.title}</h3>
            <p className="text-xs text-gray-500 mt-2">
              {new Date(q.submittedAt).toLocaleDateString("ru-RU")}
            </p>
          </div>
          <div className="flex items-center justify-between gap-2 mt-4">
            {q.challenge.price && q.challenge.price > 0 && (
              <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded">
                +{(q.challenge.price / 100).toLocaleString("ru-RU")} ₽
              </span>
            )}
            <button
              onClick={() => onTake(q.id)}
              disabled={loading === q.id}
              className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {loading === q.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <ClipboardList className="w-3.5 h-3.5" />
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
  questionnaires,
  onCancel,
  loading,
}: {
  submissions: Submission[];
  questionnaires: QuestionnaireSubmission[];
  onCancel: (id: string, isQuestionnaire?: boolean) => void;
  loading: string | null;
}) {
  if (submissions.length === 0 && questionnaires.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Нет работ на проверке</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {submissions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Работы</h3>
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
                    onClick={() => onCancel(s.id, false)}
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
        </div>
      )}
      
      {questionnaires.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Вопросники</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {questionnaires.map((q) => (
              <div
                key={q.id}
                className="border border-amber-200 bg-amber-50 rounded-lg p-4 flex flex-col"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{q.challenge.title}</h3>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(q.submittedAt).toLocaleDateString("ru-RU")}
                  </p>
                </div>
                <div className="flex flex-col gap-2 mt-4">
                  <Link
                    href={`/account/supervision/questionnaires/${q.id}`}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors text-center flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Проверить
                  </Link>
                  <button
                    onClick={() => onCancel(q.id, true)}
                    disabled={loading === q.id}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    {loading === q.id ? (
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
        </div>
      )}
    </div>
  );
}

function HistoryTab({ reviews }: { reviews: ReviewHistory[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState<string | null>(null);

  const openComment = (comment: string) => {
    setSelectedComment(comment);
    setModalOpen(true);
  };

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>История проверок пуста</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left font-medium text-gray-600 w-10"></th>
              <th className="px-3 py-3 text-left font-medium text-gray-600 w-24">Тип</th>
              <th className="px-3 py-3 text-left font-medium text-gray-600 w-28">Дата</th>
              <th className="px-3 py-3 text-left font-medium text-gray-600">Название</th>
              <th className="px-3 py-3 text-left font-medium text-gray-600 w-28">Вердикт</th>
              <th className="px-3 py-3 text-left font-medium text-gray-600 w-24">Комментарий</th>
              <th className="px-3 py-3 text-left font-medium text-gray-600 w-24">Начислено</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((r) => (
              <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-3">
                  {r.status === "CANCELLED" ? (
                    <MinusCircle className="w-5 h-5 text-gray-400" />
                  ) : r.verdict === "APPROVED" ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </td>
                <td className="px-3 py-3">
                  {r.type === 'WORK' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                      <FileBadge className="w-3 h-3" />
                      Работа
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                      <FileText className="w-3 h-3" />
                      Вопросник
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 text-gray-600">
                  {r.resolvedAt ? new Date(r.resolvedAt).toLocaleDateString("ru-RU") : "-"}
                </td>
                <td className="px-3 py-3 font-medium text-gray-900 max-w-xs truncate">
                  {r.challenge.title}
                </td>
                <td className="px-3 py-3">
                  {r.status === "CANCELLED" ? (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Отказ</span>
                  ) : r.verdict === "APPROVED" ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Одобрено</span>
                  ) : (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Отклонено</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  {r.comment ? (
                    <button
                      onClick={() => openComment(r.comment!)}
                      className="text-blue-600 hover:text-blue-800 hover:underline text-xs font-medium"
                    >
                      Показать
                    </button>
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  {r.earning > 0 ? (
                    <span className="text-green-700 font-medium text-xs">
                      +{(r.earning / 100).toLocaleString('ru-RU')} ₽
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Модалка с комментарием */}
      {modalOpen && selectedComment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Комментарий супервизора</h3>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
              {selectedComment}
            </div>
            <button
              onClick={() => setModalOpen(false)}
              className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </>
  );
}