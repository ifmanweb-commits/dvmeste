'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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

export default function ChallengePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const attemptIdFromQuery = searchParams.get('attempt');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
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

      setAttemptId(id);
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

  // Начальная загрузка
  useEffect(() => {
    if (attemptIdFromQuery) {
      loadAttempt(attemptIdFromQuery);
    } else {
      // Нет attemptId в URL - показываем кнопку начала
      setLoading(false);
    }
  }, [attemptIdFromQuery, loadAttempt]);

  // Таймер
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  // Автозавершение при истечении времени
  useEffect(() => {
    if (timeRemaining === 0 && attemptId && !result) {
      finishTest();
    }
  }, [timeRemaining, attemptId, result]);

  // Начало новой попытки
  const startAttempt = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/challenge/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to start');
      }

      // Перезагружаем с attemptId
      router.push(`/account/challenge/${slug}?attempt=${data.attemptId}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Сохранение ответа
  const saveAnswer = async (questionIndex: number, selectedAnswers: number[]) => {
    if (!attemptId) return;

    try {
      const res = await fetch(`/api/challenge/${attemptId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionIndex,
          answers: selectedAnswers,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save answer');
      }

      setAnswers((prev) => ({
        ...prev,
        [questionIndex.toString()]: selectedAnswers,
      }));
    } catch (err: any) {
      console.error('Error saving answer:', err);
    }
  };

  // Завершение теста
  const finishTest = async () => {
    if (!attemptId || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/challenge/${attemptId}/finish`, {
        method: 'POST',
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
        timeExpired: data.timeExpired,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Обработка выбора ответа
  const handleAnswerChange = (optionIndex: number) => {
    const question = questions[currentQuestionIndex];
    if (!question) return;

    const currentAnswer = answers[currentQuestionIndex.toString()] || [];
    let newAnswer: number[];

    if (question.type === 'single') {
      newAnswer = [optionIndex];
    } else {
      const exists = currentAnswer.includes(optionIndex);
      newAnswer = exists
        ? currentAnswer.filter((i) => i !== optionIndex)
        : [...currentAnswer, optionIndex];
    }

    saveAnswer(currentQuestionIndex, newAnswer);
  };

  // Навигация
  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Форматирование времени
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Рендеринг результата
  if (result) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            {result.passed ? (
              <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            ) : (
              <XCircle className="mx-auto h-16 w-16 text-red-500" />
            )}

            <h1 className="mt-4 text-2xl font-bold text-gray-900">
              {result.passed ? 'Поздравляем! Тест сдан!' : 'Тест не сдан'}
            </h1>

            {result.timeExpired && (
              <p className="mt-2 text-red-600">
                <AlertCircle className="inline h-4 w-4 mr-1" />
                Время истекло
              </p>
            )}

            <div className="mt-6 rounded-lg bg-gray-50 p-6">
              <div className="text-4xl font-bold text-gray-900">
                {result.score} из {result.totalQuestions}
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Проходной балл: {result.passingScore}
              </p>
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
  if (loading && !attemptId) {
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
      <div className="max-w-2xl mx-auto">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            <Award className="mx-auto h-16 w-16 text-gray-400" />
            <h1 className="mt-4 text-xl font-bold text-gray-900">
              {error || 'Готовы начать тест?'}
            </h1>
            {error && (
              <p className="mt-2 text-red-600">{error}</p>
            )}
            <div className="mt-6">
              <button
                onClick={startAttempt}
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
  const answeredCount = Object.keys(answers).length;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Заголовок и таймер */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <nav className="text-sm text-gray-600">
            <Link href="/account/certification" className="hover:text-gray-900">
              Сертификация
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{challengeTitle}</span>
          </nav>
        </div>
        {timeLimit && timeRemaining !== null && (
          <div
            className={`flex items-center gap-2 rounded-lg px-4 py-2 ${
              timeRemaining < 60
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            <Clock className="h-5 w-5" />
            <span className="font-mono font-medium">{formatTime(timeRemaining)}</span>
          </div>
        )}
      </div>

      {/* Прогресс */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Вопрос {currentQuestionIndex + 1} из {questions.length}
          </span>
          <span>
            Отвечено: {answeredCount} из {questions.length}
          </span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-[#5858E2] transition-all"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Вопрос */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          {currentQuestion?.text}
        </h2>

        <div className="mt-6 space-y-3">
          {currentQuestion?.options.map((option, index) => {
            const isSelected = currentAnswer.includes(index);
            return (
              <label
                key={index}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                  isSelected
                    ? 'border-[#5858E2] bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type={currentQuestion?.type === 'single' ? 'radio' : 'checkbox'}
                  name={`question-${currentQuestionIndex}`}
                  checked={isSelected}
                  onChange={() => handleAnswerChange(index)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-gray-900">{option}</span>
              </label>
            );
          })}
        </div>

        {/* Навигация */}
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={goToPrevQuestion}
            disabled={currentQuestionIndex === 0}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50"
          >
            ← Назад
          </button>

          {isLastQuestion ? (
            <button
              type="button"
              onClick={finishTest}
              disabled={isSubmitting || answeredCount < questions.length}
              className="rounded-lg bg-[#5858E2] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9] disabled:opacity-50"
            >
              {isSubmitting ? 'Завершение...' : 'Завершить тест'}
            </button>
          ) : (
            <button
              type="button"
              onClick={goToNextQuestion}
              className="rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]"
            >
              Далее →
            </button>
          )}
        </div>
      </div>

      {/* Навигация по вопросам */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-medium text-gray-700">Навигация по вопросам:</h3>
        <div className="flex flex-wrap gap-2">
          {questions.map((_, index) => {
            const isAnswered = !!answers[index.toString()];
            const isCurrent = index === currentQuestionIndex;
            return (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentQuestionIndex(index)}
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                  isCurrent
                    ? 'bg-[#5858E2] text-white'
                    : isAnswered
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}