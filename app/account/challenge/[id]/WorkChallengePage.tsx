'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Award, CheckCircle, XCircle, AlertCircle, Play, Upload, FileText } from 'lucide-react';

interface WorkChallengeData {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  requiredReviews: number;
  reviewsToPass: number;
}

interface WorkAttemptStatus {
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'COMPLETED';
  passed?: boolean;
  submittedAt?: string | null;
  reviewCount?: number;
  positiveReviews?: number;
  requiredReviews?: number;
}

interface WorkChallengePageProps {
  challengeId: string;
  attemptId?: string | null;
}

export default function WorkChallengePage({ challengeId, attemptId }: WorkChallengePageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attemptIdState, setAttemptIdState] = useState<string | null>(attemptId || null);
  const [challenge, setChallenge] = useState<WorkChallengeData | null>(null);
  const [status, setStatus] = useState<WorkAttemptStatus | null>(null);
  const [workText, setWorkText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  // Загрузка состояния работы
  const loadWork = useCallback(async (attemptId: string) => {
    try {
      const res = await fetch(`/api/challenge/${attemptId}/work/status`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load work status');
      }

      setStatus(data);
      if (data.workText) {
        setWorkText(data.workText);
      }
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }, []);

  // Загрузка информации о испытании
  const loadChallenge = useCallback(async () => {
    try {
      const res = await fetch(`/api/challenge/${challengeId}/type`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load challenge');
      }

      if (data.type !== 'WORK') {
        throw new Error('Это не квалификационная работа');
      }

      setChallenge({
        id: data.id,
        title: data.title,
        description: data.description,
        instructions: data.work?.instructions || null,
        requiredReviews: data.work?.requiredReviews || 1,
        reviewsToPass: data.work?.reviewsToPass || 1,
      });
    } catch (err: any) {
      setError(err.message);
    }
  }, [challengeId]);

  // Начальная загрузка
  useEffect(() => {
    loadChallenge();
    
    if (attemptIdState) {
      loadWork(attemptIdState);
    } else {
      setLoading(false);
    }
  }, [attemptIdState, loadWork, loadChallenge]);

  // Начало новой попытки
  const startWork = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/challenge/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to start');
      }

      router.push(`/account/challenge/${challengeId}?attempt=${data.attemptId}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Отправка работы
  const submitWork = async () => {
    if (!attemptIdState) return;

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const res = await fetch(`/api/challenge/${attemptIdState}/work/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workText }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit');
      }

      setSubmitMessage('Работа отправлена на проверку!');
      setStatus(data.status);
      
      // Перезагрузка через 2 секунды
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      setSubmitMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Рендеринг результата
  if (status?.status === 'COMPLETED') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            {status.passed ? (
              <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            ) : (
              <XCircle className="mx-auto h-16 w-16 text-red-500" />
            )}

            <h1 className="mt-4 text-2xl font-bold text-gray-900">
              {status.passed ? 'Работа принята!' : 'Работа не принята'}
            </h1>

            <div className="mt-6 rounded-lg bg-gray-50 p-6">
              <div className="text-sm text-gray-600">
                <p>Положительных отзывов: {status.positiveReviews} из {status.requiredReviews}</p>
              </div>
            </div>

            <div className="mt-8">
              <Link
                href="/account/certification"
                className="inline-flex items-center rounded-lg bg-[#5858E2] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]"
              >
                Вернуться к сертификации
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Рендеринг загрузки
  if (loading && !challenge) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#5858E2] border-t-transparent" />
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Рендеринг ошибки или кнопки начала
  if (error || !attemptIdState) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            <Award className="mx-auto h-16 w-16 text-gray-400" />
            <h1 className="mt-4 text-xl font-bold text-gray-900">
              {challenge?.title || 'Квалификационная работа'}
            </h1>
            {error && (
              <p className="mt-2 text-red-600">{error}</p>
            )}
            <div className="mt-6">
              <button
                onClick={startWork}
                disabled={isSubmitting}
                className="inline-flex items-center rounded-lg bg-[#5858E2] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9] disabled:opacity-50"
              >
                <Play className="mr-2 h-5 w-5" />
                {isSubmitting ? 'Загрузка...' : 'Начать работу'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Заголовок */}
      <div className="mb-6">
        <nav className="text-sm text-gray-600">
          <Link href="/account/certification" className="hover:text-gray-900">
            Сертификация
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{challenge?.title}</span>
        </nav>
      </div>

      {/* Статус */}
      {status?.status === 'SUBMITTED' && (
        <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
          <div className="flex items-center gap-2 text-blue-800">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Работа отправлена на проверку</span>
          </div>
          <p className="mt-2 text-sm text-blue-700">
            Ожидайте решения супервизора. Необходимо {status.requiredReviews} положительных отзывов.
          </p>
        </div>
      )}

      {/* Инструкция */}
      {challenge?.instructions && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Инструкция для супервизора
          </h2>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{challenge.instructions}</p>
          </div>
        </div>
      )}

      {/* Форма отправки работы */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Ваша работа
        </h2>

        {submitMessage && (
          <div className={`mb-4 rounded-lg p-4 ${
            submitMessage.includes('ошибка') || submitMessage.includes('Failed')
              ? 'bg-red-50 text-red-800'
              : 'bg-green-50 text-green-800'
          }`}>
            {submitMessage}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="workText" className="block text-sm font-medium text-gray-700 mb-2">
            Текст работы
          </label>
          <textarea
            id="workText"
            value={workText}
            onChange={(e) => setWorkText(e.target.value)}
            rows={10}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20 outline-none resize-y"
            placeholder="Введите текст вашей работы здесь..."
            disabled={status?.status === 'SUBMITTED'}
          />
          <p className="mt-2 text-sm text-gray-500">
            Опишите ваш опыт, кейсы или другие материалы для проверки
          </p>
        </div>

        {/* Кнопка отправки */}
        {(status?.status === 'IN_PROGRESS' || !status) && (
          <button
            onClick={submitWork}
            disabled={isSubmitting || !workText.trim()}
            className="inline-flex items-center rounded-lg bg-[#5858E2] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="mr-2 h-5 w-5" />
            {isSubmitting ? 'Отправка...' : 'Отправить на проверку'}
          </button>
        )}

        {status?.status === 'SUBMITTED' && (
          <div className="flex items-center gap-2 text-gray-500">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Работа отправлена на проверку</span>
          </div>
        )}
      </div>

      {/* Требования */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Требования для сдачи
        </h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <span>Необходимо положительных отзывов:</span>
            <span className="font-medium">{challenge?.reviewsToPass} из {challenge?.requiredReviews}</span>
          </div>
          {status && (
            <div className="flex items-center justify-between">
              <span>Получено отзывов:</span>
              <span className="font-medium">{status.reviewCount || 0}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}