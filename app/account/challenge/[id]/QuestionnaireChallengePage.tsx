'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Clock, Play, FileText } from 'lucide-react';
import CertificationHorNav from '@/components/account/CertificationHorNav';

interface Question {
  index: number;
  text: string;
}

interface QuestionnaireChallengePageProps {
  challengeId: string;
  attemptId?: string | null;
}

export default function QuestionnaireChallengePage({ challengeId, attemptId }: QuestionnaireChallengePageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attemptIdState, setAttemptIdState] = useState<string | null>(attemptId || null);
  const [challengeTitle, setChallengeTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timeLimit, setTimeLimit] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [instructionsForPsychologist, setInstructionsForPsychologist] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  // Загрузка состояния попытки
  const loadAttempt = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/challenge/${id}/status`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load attempt');
      }

      if (data.status === 'COMPLETED' || data.submissionStatus) {
        setIsSubmitted(true);
        setLoading(false);
        return;
      }

      setAttemptIdState(id);
      setChallengeTitle(data.challengeTitle);
      setQuestions(data.questions || []);
      setAnswers(data.answers || {});
      setTimeRemaining(data.timeRemaining);
      setTimeLimit(data.timeLimit);
      setInstructionsForPsychologist(data.instructionsForPsychologist || null);
      
      // Показываем инструкцию если она есть
      if (data.instructionsForPsychologist) {
        setShowInstructions(true);
      }

      // Определяем текущий вопрос (первый без ответа или 0)
      let firstUnanswered = 0;
      for (let i = 0; i < data.questionsCount; i++) {
        if (!data.answers || !data.answers[i.toString()]) {
          firstUnanswered = i;
          break;
        }
      }
      setCurrentQuestionIndex(firstUnanswered);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }, []);

  // Начальная загрузка
  useEffect(() => {
    if (attemptIdState) {
      loadAttempt(attemptIdState);
    } else {
      setLoading(false);
    }
  }, [attemptIdState, loadAttempt]);

  // Таймер
  useEffect(() => {
    if (!timeRemaining || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (!prev || prev <= 1) {
          // Время истекло - автоматически отправляем
          finishQuestionnaire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // Начало новой попытки
  const startQuestionnaire = async () => {
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

  // Выбор ответа
  const selectAnswer = (answer: string) => {
    setAnswers({ ...answers, [currentQuestionIndex.toString()]: answer });
  };

  // Переход к следующему вопросу
  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // Переход к предыдущему вопросу
  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Отправка вопросника
  const finishQuestionnaire = async () => {
    if (!attemptIdState) return;

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/challenge/${attemptIdState}/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to finish');
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Форматирование времени
  const formatTime = (seconds: number | null) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Рендеринг результата (отправлено на проверку)
  if (isSubmitted) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            <FileText className="mx-auto h-16 w-16 text-[#5858E2]" />
            <h1 className="mt-4 text-2xl font-bold text-gray-900">
              Ответы отправлены на проверку
            </h1>
            <p className="mt-4 text-gray-600">
              Ваш вопросник отправлен супервизорам на проверку. 
              Вы получите уведомление о результате проверки.
            </p>
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
  if (loading && !attemptIdState) {
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
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            <FileText className="mx-auto h-16 w-16 text-gray-400" />
            <h1 className="mt-4 text-xl font-bold text-gray-900">Готовы начать вопросник?</h1>
            {error && (
              <p className="mt-2 text-red-600">{error}</p>
            )}
            <div className="mt-6">
              <button
                onClick={startQuestionnaire}
                disabled={isSubmitting}
                className="inline-flex items-center rounded-lg bg-[#5858E2] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9] disabled:opacity-50"
              >
                <Play className="mr-2 h-5 w-5" />
                {isSubmitting ? 'Загрузка...' : 'Начать вопросник'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Модальное окно с инструкцией
  if (showInstructions && instructionsForPsychologist) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            <FileText className="mx-auto h-16 w-16 text-[#5858E2]" />
            <h1 className="mt-4 text-2xl font-bold text-gray-900">
              Инструкция перед началом
            </h1>
            <div className="mt-6 text-left">
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700">
                {instructionsForPsychologist}
              </div>
            </div>
            <div className="mt-8">
              <button
                onClick={() => setShowInstructions(false)}
                className="inline-flex items-center rounded-lg bg-[#5858E2] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]"
              >
                <Play className="mr-2 h-5 w-5" />
                Начать вопросник
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestionIndex.toString()] || '';
  const hasAnswer = currentAnswer.length > 0;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // Если questions ещё не загружены или currentQuestion не определён
  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#5858E2] border-t-transparent" />
          <p className="mt-4 text-gray-600">Загрузка вопросов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Навигационная панель */}
      <CertificationHorNav activeTab="questionnaires" />

      {/* Заголовок */}
      <div className="mb-6">
        <nav className="text-sm text-gray-600">
          <Link href="/account/certification" className="hover:text-gray-900">
            Сертификация
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{challengeTitle}</span>
        </nav>
      </div>

      {/* Таймер */}
      {timeLimit && timeRemaining !== null && (
        <div className={`mb-6 flex items-center justify-between rounded-lg p-4 ${
          timeRemaining < 60 ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'
        }`}>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span className="font-medium">Осталось времени:</span>
          </div>
          <span className="text-xl font-bold">{formatTime(timeRemaining)}</span>
        </div>
      )}

      {/* Прогресс */}
      <div className="mb-6 flex items-center justify-between text-sm text-gray-600">
        <span>Вопрос {currentQuestionIndex + 1} из {questions.length}</span>
        <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span>
      </div>
      <div className="mb-6 h-2 w-full rounded-full bg-gray-200">
        <div
          className="h-2 rounded-full bg-[#5858E2] transition-all"
          style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Вопрос */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          {currentQuestion.text}
        </h2>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ваш ответ:
          </label>
          <textarea
            value={currentAnswer}
            onChange={(e) => selectAnswer(e.target.value)}
            rows={6}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
            placeholder="Введите ваш ответ здесь..."
          />
        </div>

        {/* Навигация */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={prevQuestion}
            disabled={currentQuestionIndex === 0}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Назад
          </button>

          {isLastQuestion ? (
            <button
              onClick={finishQuestionnaire}
              disabled={!hasAnswer || isSubmitting}
              className="rounded-lg bg-[#5858E2] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Отправка...' : 'Отправить на проверку'}
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              className="rounded-lg bg-[#5858E2] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]"
            >
              Далее
            </button>
          )}
        </div>
      </div>

      {/* Навигация по вопросам */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Навигация по вопросам
        </h3>
        <div className="flex flex-wrap gap-2">
          {questions.map((_, idx) => {
            const hasAnswerForQuestion = answers[idx.toString()]?.length > 0;
            const isCurrent = idx === currentQuestionIndex;
            return (
              <button
                key={idx}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-all ${
                  isCurrent
                    ? 'bg-[#5858E2] text-white'
                    : hasAnswerForQuestion
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}