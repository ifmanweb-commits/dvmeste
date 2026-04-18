"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Challenge {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  questionsCount: number;
  passingScore: number;
}

interface Question {
  questionIndex: number;
  originalIndex: number;
  text: string;
  type: "single" | "multiple";
  options: string[];
}

interface QuestionData extends Question {
  correct: number[];
  explanation?: string;
}

interface PracticeTestRunnerProps {
  challenge: Challenge;
  userId: string;
}

type TestState = "loading" | "ready" | "answering" | "result" | "finished";

export default function PracticeTestRunner({ challenge, userId }: PracticeTestRunnerProps) {
  const router = useRouter();
  
  const [state, setState] = useState<TestState>("loading");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsPool, setQuestionsPool] = useState<QuestionData[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState<Record<number, boolean>>({});

  // Загрузка вопросов
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const response = await fetch(`/api/training/test/${challenge.slug}/start`);
        const data = await response.json();

        if (response.ok) {
          setQuestions(data.questions);
          setState("ready");
        } else {
          console.error("Ошибка загрузки вопросов:", data.error);
          router.push("/account/training");
        }
      } catch (error) {
        console.error("Ошибка при загрузке вопросов:", error);
        router.push("/account/training");
      }
    };

    loadQuestions();
  }, [challenge.slug, router]);

  // Загрузка полного пула вопросов с правильными ответами для проверки
  useEffect(() => {
    const loadQuestionsPool = async () => {
      try {
        const response = await fetch(`/api/training/test/${challenge.slug}/pool`);
        const data = await response.json();

        if (response.ok) {
          setQuestionsPool(data.questionsPool);
        }
      } catch (error) {
        console.error("Ошибка при загрузке пула вопросов:", error);
      }
    };

    if (state === "ready") {
      loadQuestionsPool();
    }
  }, [challenge.slug, state]);

  // Обработка выбора ответа
  const handleAnswerSelect = (optionIndex: number) => {
    const currentQuestion = questions[currentQuestionIndex];
    
    if (currentQuestion.type === "single") {
      setSelectedAnswers([optionIndex]);
    } else {
      setSelectedAnswers((prev) =>
        prev.includes(optionIndex)
          ? prev.filter((i) => i !== optionIndex)
          : [...prev, optionIndex]
      );
    }
  };

  // Проверка ответа
  const checkAnswer = useCallback(() => {
    const currentQuestion = questions[currentQuestionIndex];
    const poolQuestion = questionsPool.find(
      (q) => q.originalIndex === currentQuestion.originalIndex
    );

    if (!poolQuestion) return { isCorrect: false, correct: [], explanation: "" };

    const userAnswers = selectedAnswers.sort((a, b) => a - b);
    const correctAnswers = poolQuestion.correct.sort((a, b) => a - b);

    const isCorrect =
      userAnswers.length === correctAnswers.length &&
      userAnswers.every((a, i) => a === correctAnswers[i]);

    return {
      isCorrect,
      correct: poolQuestion.correct,
      explanation: poolQuestion.explanation || "",
    };
  }, [questions, currentQuestionIndex, selectedAnswers, questionsPool]);

  // Подтверждение ответа
  const handleSubmitAnswer = () => {
    if (selectedAnswers.length === 0) return;

    const result = checkAnswer();
    const currentQuestion = questions[currentQuestionIndex];

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.questionIndex]: selectedAnswers,
    }));

    setCorrectAnswers((prev) => ({
      ...prev,
      [currentQuestion.questionIndex]: result.isCorrect,
    }));

    if (result.isCorrect) {
      setScore((prev) => prev + 1);
    }

    setShowResult(true);
    setState("answering");
  };

  // Переход к следующему вопросу
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswers([]);
      setShowResult(false);
    } else {
      setState("finished");
    }
  };

  // Завершение теста
  const handleFinish = () => {
    setState("finished");
  };

  // Перезапуск теста
  const handleRestart = () => {
    setAnswers({});
    setCorrectAnswers({});
    setScore(0);
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setShowResult(false);
    setState("loading");
    
    // Перезагружаем вопросы
    const loadQuestions = async () => {
      try {
        const response = await fetch(`/api/training/test/${challenge.slug}/start`);
        const data = await response.json();

        if (response.ok) {
          setQuestions(data.questions);
          setState("ready");
        }
      } catch (error) {
        console.error("Ошибка при загрузке вопросов:", error);
      }
    };

    loadQuestions();
  };

  // Возврат к обучению
  const handleBackToTraining = () => {
    router.push("/account/key-active");
  };

  const currentQuestion = questions[currentQuestionIndex];
  const poolQuestion = questionsPool.find(
    (q) => q.originalIndex === currentQuestion?.originalIndex
  );
  const answerResult = checkAnswer();

  // Экран загрузки
  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#5858E2] border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Загрузка вопросов...</p>
        </div>
      </div>
    );
  }

  // Экран результатов
  if (state === "finished") {
    const percentage = Math.round((score / questions.length) * 100);
    const passed = score >= challenge.passingScore;

    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="text-center">
              <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
                passed ? "bg-green-100" : "bg-amber-100"
              }`}>
                {passed ? (
                  <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-10 w-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>

              <h1 className="mt-6 text-2xl font-bold text-gray-900">
                {passed ? "Тест завершён!" : "Тест завершён"}
              </h1>

              <div className="mt-4 text-lg text-gray-600">
                Ваш результат:{" "}
                <span className={`font-bold ${passed ? "text-green-600" : "text-amber-600"}`}>
                  {score} из {questions.length}
                </span>{" "}
                ({percentage}%)
              </div>

              {passed ? (
                <p className="mt-2 text-green-600">
                  Поздравляем! Вы набрали проходной балл ({challenge.passingScore}).
                </p>
              ) : (
                <p className="mt-2 text-amber-600">
                  Для сдачи нужно набрать {challenge.passingScore} правильных ответов.
                </p>
              )}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  onClick={handleRestart}
                  className="rounded-lg bg-[#5858E2] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]"
                >
                  Пройти заново
                </button>
                <button
                  onClick={handleBackToTraining}
                  className="rounded-lg bg-gray-100 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                >
                  Закончить тренировку
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Основной экран прохождения теста
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-3xl">
        {/* Заголовок */}
        <div className="mb-6">
          <Link
            href="/account/key-active"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Назад
          </Link>
          <h1 className="mt-2 text-xl font-bold text-gray-900 md:text-2xl">
            {challenge.title}
          </h1>
        </div>

        {/* Прогресс бар */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Вопрос {currentQuestionIndex + 1} из {questions.length}</span>
            <span>Правильных: {score}</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-[#5858E2] transition-all"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Карточка вопроса */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {/* Тип вопроса */}
          <div className="mb-4">
            <span className="inline-flex rounded-full bg-[#5858E2]/10 px-3 py-1 text-xs font-medium text-[#5858E2]">
              {currentQuestion?.type === "single" ? "Один ответ" : "Несколько ответов"}
            </span>
          </div>

          {/* Текст вопроса */}
          <h2 className="text-lg font-medium text-gray-900">
            {currentQuestion?.text}
          </h2>

          {/* Варианты ответов */}
          <div className="mt-6 space-y-3">
            {currentQuestion?.options.map((option, index) => {
              const isSelected = selectedAnswers.includes(index);
              const isAnswered = showResult;
              const isCorrect = poolQuestion?.correct.includes(index);

              let borderColor = "border-gray-200";
              let bgColor = "bg-white";

              if (isAnswered) {
                if (isCorrect) {
                  borderColor = "border-green-500";
                  bgColor = "bg-green-50";
                } else if (isSelected && !isCorrect) {
                  borderColor = "border-red-500";
                  bgColor = "bg-red-50";
                }
              } else if (isSelected) {
                borderColor = "border-[#5858E2]";
                bgColor = "bg-[#5858E2]/5";
              }

              return (
                <button
                  key={index}
                  onClick={() => !isAnswered && handleAnswerSelect(index)}
                  disabled={isAnswered}
                  className={`w-full rounded-lg border-2 p-4 text-left transition-all ${borderColor} ${bgColor} ${
                    !isAnswered ? "hover:border-[#5858E2]/50 hover:bg-gray-50" : ""
                  } disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                      isAnswered && isCorrect
                        ? "border-green-500 bg-green-500 text-white"
                        : isSelected
                        ? "border-[#5858E2] bg-[#5858E2] text-white"
                        : "border-gray-300"
                    }`}>
                      {currentQuestion.type === "single" ? (
                        <div className={`h-2.5 w-2.5 rounded-full ${
                          isAnswered && isCorrect
                            ? "bg-white"
                            : isSelected
                            ? "bg-white"
                            : ""
                        }`} />
                      ) : (
                        <svg className={`h-4 w-4 ${
                          isAnswered && isCorrect
                            ? "text-white"
                            : isSelected
                            ? "text-white"
                            : "text-transparent"
                        }`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="text-gray-900">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Результат и объяснение */}
          {showResult && poolQuestion && (
            <div className="mt-6 rounded-lg bg-gray-50 p-4">
              <div className={`mb-3 flex items-center gap-2 ${
                answerResult.isCorrect ? "text-green-600" : "text-red-600"
              }`}>
                {answerResult.isCorrect ? (
                  <>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">Правильно!</span>
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="font-medium">Неправильно</span>
                  </>
                )}
              </div>

              {!answerResult.isCorrect && (
                <div className="mb-3 text-sm text-gray-700">
                  <span className="font-medium">Правильный ответ:</span>{" "}
                  {answerResult.correct
                    .map((i) => poolQuestion.options[i])
                    .join(", ")}
                </div>
              )}

              {poolQuestion.explanation && (
                <div className="rounded-lg bg-white p-3 text-sm text-gray-700">
                  <span className="font-medium text-gray-900">Объяснение:</span>{" "}
                  {poolQuestion.explanation}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Кнопки управления */}
        <div className="mt-6 flex justify-end">
          {!showResult ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={selectedAnswers.length === 0}
              className="rounded-lg bg-[#5858E2] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9] disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Проверить ответ
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="rounded-lg bg-[#5858E2] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]"
            >
              {currentQuestionIndex < questions.length - 1 ? "Следующий вопрос" : "Завершить тест"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}