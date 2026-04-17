'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Award, CheckCircle, XCircle, Clock, AlertCircle, Play } from 'lucide-react';

interface Question {
  index: number;
  text: string;
  type: 'single' | 'multiple';
  options: string[];
}

interface AttemptStatus {
  status: 'IN_PROGRESS' | 'COMPLETED';
  passed?: boolean;
  score?: number;
  passingScore?: number;
  totalQuestions?: number;
  questions?: Question[];
  answers?: Record<string, number[]>;
  timeRemaining?: number | null;
  timeLimit?: number | null;
  timeExpired?: boolean;
}

interface TestChallengePageProps {
  challengeId: string;
  attemptId?: string | null;
}

export default function TestChallengePage({ challengeId, attemptId }: TestChallengePageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attemptIdState, setAttemptIdState] = useState<string | null>(attemptId || null);
  const [challengeTitle, setChallengeTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timeLimit, setTimeLimit] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Результат теста
  const [result, setResult] = useState<{
    passed: boolean;
    score: number;
    passingScore: number;
    totalQuestions: number;
    timeExpired?: boolean;
  } | null>(null);

  // Загрузка состояния попытки
  const loadAttempt = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/challenge/${id}/status`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load attempt');
      }

      if (data.status === 'COMPLETED') {
        setResult({
          passed: data.passed || false,
          score: data.score || 0,
          passingScore: data.passingScore || 0,
          totalQuestions: data.totalQuestions || 0,
          timeExpired: data.timeExpired,
        });
        setLoading(false);
        return;
      }

      setChallengeTitle(data.challengeTitle);
      setQuestions(data.questions || []);
      setAnswers(data.answers || {});
      setTimeRemaining(data.timeRemaining);
      setTimeLimit(data.timeLimit);

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

  // Начальная загрузка - загружаем только если есть attemptId из URL
  useEffect(() => {
    if (attemptId) {
      setLoading(true);
      setError(null);
      loadAttempt(attemptId);
    } else {
      setLoading(false);
    }
  }, [attemptId, loadAttempt]);

  // Начало новой попытки
  const startTest = async () => {
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

  // Сохранение ответов на сервер (с debouncing)
  const saveAnswers = useCallback(async (answersToSave: Record<string, number[]>) => {
    if (!attemptIdState) return;
    
    try {
      await fetch(`/api/challenge/${attemptIdState}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answersToSave }),
      });
    } catch (err) {
      console.error('Error saving answers:', err);
    }
  }, [attemptIdState]);

  // Debounced сохранение - сохраняем только при изменении конкретного вопроса
  const saveAnswerForQuestion = useCallback((questionIndex: number, answer: number[]) => {
    const answersToSave = { [questionIndex.toString()]: answer };
    saveAnswers(answersToSave);
  }, [saveAnswers]);

  // Выбор ответа
  const selectAnswer = (optionIndex: number) => {
    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers[currentQuestionIndex.toString()] || [];

    let newAnswer: number[];

    if (currentQuestion.type === 'single') {
      newAnswer = [optionIndex];
    } else {
      // Multiple
      if (currentAnswer.includes(optionIndex)) {
        newAnswer = currentAnswer.filter((i) => i !== optionIndex);
      } else {
        newAnswer = [...currentAnswer, optionIndex];
      }
    }

    setAnswers(prev => ({ ...prev, [currentQuestionIndex.toString()]: newAnswer }));
    saveAnswerForQuestion(currentQuestionIndex, newAnswer);
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

  // Отправка теста
  const finishTest = useCallback(async (timeExpired = false) => {
    if (!attemptIdState) return;

    setIsSubmitting(true);

    try {
      // Сначала сохраняем ответы
      await fetch(`/api/challenge/${attemptIdState}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });

      // Затем завершаем тест
      const res = await fetch(`/api/challenge/${attemptIdState}/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to finish');
      }

      setResult({
        passed: data.passed,
        score: data.score,
        passingScore: data.passingScore,
        totalQuestions: data.totalQuestions,
        timeExpired: data.timeExpired || timeExpired,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [attemptIdState, answers]);

  // Таймер
  useEffect(() => {
    if (!timeRemaining || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (!prev || prev <= 1) {
          // Время истекло
          clearInterval(timer);
          finishTest(true);
          return 0;
        }
        return prev ? prev - 1 : 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, attemptId, finishTest]);

  // Рендеринг результата
  if (result) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            {result.passed ? (
              <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            ) : (
              <XCircle className="mx-auto h-16 w-16 text-red-500" />
            )}

            <h1 className="mt-4 text-2xl font-bold text-gray-900">
              {result.passed ? 'Тест сдан!' : 'Тест не сдан'}
            </h1>

            {result.timeExpired && (
              <div className="mt-4 rounded-lg bg-red-50 p-4 text-red-800">
                <AlertCircle className="mx-auto mb-2 h-6 w-6" />
                <p>Время выполнения теста истекло</p>
              </div>
            )}

            <div className="mt-6 rounded-lg bg-gray-50 p-6">
              <div className="text-sm text-gray-600">
                <p>
                  Ваш результат: <span className="font-semibold">{result.score} из {result.totalQuestions}</span>
                </p>
                <p>
                  Проходной балл: <span className="font-semibold">{result.passingScore}</span>
                </p>
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
  if (loading) {
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
  if (error || !attemptId) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            <Award className="mx-auto h-16 w-16 text-gray-400" />
            <h1 className="mt-4 text-xl font-bold text-gray-900">Готовы начать тест?</h1>
            {error && (
              <p className="mt-2 text-red-600">{error}</p>
            )}
            <div className="mt-6">
              <button
                onClick={startTest}
                disabled={isSubmitting}
                className="inline-flex items-center rounded-lg bg-[#5858E2] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9] disabled:opacity-50"
              >
                <Play className="mr-2 h-5 w-5" />
                {isSubmitting ? 'Загрузка...' : 'Начать тест'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestionIndex.toString()] || [];
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

  // Форматирование времени
  const formatTime = (seconds: number | null) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mx-auto max-w-3xl">
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

        <div className="mt-6 space-y-3">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = currentAnswer.includes(idx);
            return (
              <button
                key={idx}
                onClick={() => selectAnswer(idx)}
                className={`w-full rounded-lg border p-4 text-left transition-all ${
                  isSelected
                    ? 'border-[#5858E2] bg-[#5858E2]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                    isSelected
                      ? 'border-[#5858E2] bg-[#5858E2]'
                      : 'border-gray-300'
                  }`}>
                    {isSelected && (
                      <CheckCircle className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <span className="text-gray-900">{option}</span>
                </div>
              </button>
            );
          })}
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
              onClick={() => finishTest()}
              disabled={!hasAnswer || isSubmitting}
              className="rounded-lg bg-[#5858E2] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Отправка...' : 'Завершить тест'}
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              disabled={!hasAnswer}
              className="rounded-lg bg-[#5858E2] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9] disabled:opacity-50 disabled:cursor-not-allowed"
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