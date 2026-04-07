'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Question {
  text: string;
  type: 'single' | 'multiple';
  options: string[];
  correct: number[];
  explanation: string;
}

interface TestSettings {
  questionsCount: number;
  passingScore: number;
  timeLimit: number;
  freeAttempts: number;
}

interface WorkSettings {
  instructions: string;
  requiredReviews: number;
  reviewsToPass: number;
  reviewPrice: number;
}

interface LessonSettings {
  content: string;
}

interface QuestionnaireSettings {
  questionsPool: string[];
  timeLimit: number;
  reviewPrice: number;
  requiredReviews: number;
  reviewsToPass: number;
  questionsCount: number;
  instructionsForPsychologist: string;
  instructionsForSupervisor: string;
}

export default function NewChallengePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Основная информация
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugEdited, setIsSlugEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [challengeType, setChallengeType] = useState<'TEST' | 'WORK' | 'LESSON' | 'QUESTIONNAIRE'>('TEST');
  const [isActive, setIsActive] = useState(true);

  // Настройки теста
  const [testSettings, setTestSettings] = useState<TestSettings>({
    questionsCount: 10,
    passingScore: 7,
    timeLimit: 0,
    freeAttempts: 2,
  });

  // Настройки квалификационной работы
  const [workSettings, setWorkSettings] = useState<WorkSettings>({
    instructions: '',
    requiredReviews: 1,
    reviewsToPass: 1,
    reviewPrice: 0,
  });

  // Настройки урока
  const [lessonSettings, setLessonSettings] = useState<LessonSettings>({
    content: '',
  });

  // Настройки вопросника
  const [questionnaireSettings, setQuestionnaireSettings] = useState<QuestionnaireSettings>({
    questionsPool: [],
    timeLimit: 0,
    reviewPrice: 0,
    requiredReviews: 1,
    reviewsToPass: 1,
    questionsCount: 5,
    instructionsForPsychologist: '',
    instructionsForSupervisor: '',
  });

  // Цена испытания (общая для всех типов)
  const [challengePrice, setChallengePrice] = useState(0);

  // Вопросы
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [jsonImportText, setJsonImportText] = useState('');
  
  // Для вопросника
  const [showQuestionInput, setShowQuestionInput] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [showQuestionnaireJsonImport, setShowQuestionnaireJsonImport] = useState(false);
  const [questionnaireJsonText, setQuestionnaireJsonText] = useState('');

  // Транслитерация русских букв в латиницу
  const transliterate = (text: string): string => {
    const converter: Record<string, string> = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
      'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i',
      'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
      'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
      'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch',
      'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '',
      'э': 'e', 'ю': 'yu', 'я': 'ya',
      'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D',
      'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh', 'З': 'Z', 'И': 'I',
      'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N',
      'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T',
      'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch',
      'Ш': 'Sh', 'Щ': 'Sch', 'Ъ': '', 'Ы': 'Y', 'Ь': '',
      'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
      ' ': '-', '_': '-',
    };

    return text
      .split('')
      .map((char) => converter[char] || char)
      .join('')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Генерация slug из названия
  const generateSlug = useCallback((text: string) => {
    return transliterate(text);
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!isSlugEdited) {
      setSlug(generateSlug(newTitle));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(e.target.value);
    setIsSlugEdited(true);
  };

  // Добавление вопроса
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: '',
        type: 'single',
        options: ['', ''],
        correct: [],
        explanation: '',
      },
    ]);
  };

  // Удаление вопроса
  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  // Обновление вопроса
  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  // Добавление варианта ответа
  const addOption = (questionIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.push('');
    setQuestions(newQuestions);
  };

  // Удаление варианта ответа
  const removeOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions];
    const question = newQuestions[questionIndex];
    if (question.options.length <= 2) return;
    
    question.options.splice(optionIndex, 1);
    
    // Обновляем правильные ответы
    question.correct = question.correct
      .filter((i) => i !== optionIndex)
      .map((i) => (i > optionIndex ? i - 1 : i));
    
    setQuestions(newQuestions);
  };

  // Обновление варианта ответа
  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  // Переключение правильного ответа
  const toggleCorrect = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions];
    const question = newQuestions[questionIndex];
    const correctIndex = question.correct.indexOf(optionIndex);
    
    if (question.type === 'single') {
      question.correct = [optionIndex];
    } else {
      if (correctIndex === -1) {
        question.correct.push(optionIndex);
      } else {
        question.correct.splice(correctIndex, 1);
      }
    }
    setQuestions(newQuestions);
  };

  // Импорт JSON для тестов
  const handleJsonImport = () => {
    try {
      const parsed = JSON.parse(jsonImportText);
      if (!parsed.questionsPool || !Array.isArray(parsed.questionsPool)) {
        throw new Error('Неверный формат: должно быть поле questionsPool с массивом вопросов');
      }

      const importedQuestions: Question[] = parsed.questionsPool.map((q: any) => ({
        text: q.text || '',
        type: q.type === 'multiple' ? 'multiple' : 'single',
        options: Array.isArray(q.options) ? q.options : ['', ''],
        correct: Array.isArray(q.correct) ? q.correct : [],
        explanation: q.explanation || '',
      }));

      setQuestions(importedQuestions);
      setShowJsonImport(false);
      setJsonImportText('');
    } catch (err: any) {
      alert(`Ошибка импорта JSON: ${err.message}`);
    }
  };

  // Импорт JSON для вопросника
  const handleQuestionnaireJsonImport = () => {
    try {
      const parsed = JSON.parse(questionnaireJsonText);
      const questions = Array.isArray(parsed.questionsPool) 
        ? parsed.questionsPool 
        : Array.isArray(parsed) 
          ? parsed 
          : [];
      setQuestionnaireSettings({
        ...questionnaireSettings,
        questionsPool: questions.filter((q: any) => typeof q === 'string'),
      });
      setShowQuestionnaireJsonImport(false);
      setQuestionnaireJsonText('');
    } catch (err: any) {
      alert(`Ошибка импорта JSON: ${err.message}`);
    }
  };

  // Экспорт JSON
  const handleJsonExport = () => {
    const json = JSON.stringify({ questionsPool: questions }, null, 2);
    navigator.clipboard.writeText(json);
    alert('JSON скопирован в буфер обмена');
  };

  // Сохранение
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          title,
          description,
          type: challengeType,
          isActive,
          price: challengePrice,
          ...(challengeType === 'TEST' && {
            questionsPool: questions,
            questionsCount: testSettings.questionsCount,
            passingScore: testSettings.passingScore,
            timeLimit: testSettings.timeLimit || null,
            freeAttempts: testSettings.freeAttempts,
          }),
          ...(challengeType === 'WORK' && {
            instructions: workSettings.instructions || null,
            requiredReviews: workSettings.requiredReviews,
            reviewsToPass: workSettings.reviewsToPass,
            reviewPrice: workSettings.reviewPrice || null,
          }),
          ...(challengeType === 'LESSON' && {
            content: lessonSettings.content || '',
          }),
          ...(challengeType === 'QUESTIONNAIRE' && {
            questionsPool: questionnaireSettings.questionsPool,
            timeLimit: questionnaireSettings.timeLimit || null,
            reviewPrice: questionnaireSettings.reviewPrice,
            requiredReviews: questionnaireSettings.requiredReviews,
            reviewsToPass: questionnaireSettings.reviewsToPass,
            questionsCount: questionnaireSettings.questionsCount,
            instructionsForPsychologist: questionnaireSettings.instructionsForPsychologist || null,
            instructionsForSupervisor: questionnaireSettings.instructionsForSupervisor || null,
          }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при сохранении');
      }

      router.push('/admin/challenges');
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-gray-900 sm:text-2xl">
            Создать испытание
          </h1>
          <Link
            href="/admin/challenges"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Назад к списку
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Основная информация */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Основная информация
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Название *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={handleTitleChange}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Slug *
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={handleSlugChange}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                  required
                />
                {!isSlugEdited && (
                  <p className="mt-1 text-xs text-gray-500">
                    Генерируется автоматически из названия
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Описание
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                />
              </div>

              <div className="flex gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Тип
                  </label>
                  <div className="mt-2 flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="TEST"
                        checked={challengeType === 'TEST'}
                        onChange={() => setChallengeType('TEST')}
                        className="mr-2"
                      />
                      <span className="text-sm">Тест</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="WORK"
                        checked={challengeType === 'WORK'}
                        onChange={() => setChallengeType('WORK')}
                        className="mr-2"
                      />
                      <span className="text-sm">Квалификационная работа</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="LESSON"
                        checked={challengeType === 'LESSON'}
                        onChange={() => setChallengeType('LESSON')}
                        className="mr-2"
                      />
                      <span className="text-sm">Урок</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="QUESTIONNAIRE"
                        checked={challengeType === 'QUESTIONNAIRE'}
                        onChange={() => setChallengeType('QUESTIONNAIRE')}
                        className="mr-2"
                      />
                      <span className="text-sm">Вопросник</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="mr-2 h-4 w-4 rounded border-gray-300 text-[#5858E2] focus:ring-[#5858E2]"
                    />
                    <span className="text-sm text-gray-700">Активен</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Цена разблокировки (₽)
                </label>
                <input
                  type="number"
                  min="0"
                  value={challengePrice}
                  onChange={(e) => setChallengePrice(parseInt(e.target.value) || 0)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                />
                <p className="mt-1 text-xs text-gray-500">0 = бесплатно</p>
              </div>
            </div>
          </div>

          {/* Настройки теста */}
          {challengeType === 'TEST' && (
            <>
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Настройки теста
                </h2>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Количество вопросов
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={testSettings.questionsCount}
                      onChange={(e) =>
                        setTestSettings({
                          ...testSettings,
                          questionsCount: parseInt(e.target.value) || 0,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Проходной балл
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={testSettings.passingScore}
                      onChange={(e) =>
                        setTestSettings({
                          ...testSettings,
                          passingScore: parseInt(e.target.value) || 0,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Лимит времени (мин)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={testSettings.timeLimit}
                      onChange={(e) =>
                        setTestSettings({
                          ...testSettings,
                          timeLimit: parseInt(e.target.value) || 0,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                    />
                    <p className="mt-1 text-xs text-gray-500">0 = без лимита</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Бесплатных попыток
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={testSettings.freeAttempts}
                      onChange={(e) =>
                        setTestSettings({
                          ...testSettings,
                          freeAttempts: parseInt(e.target.value) || 0,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                    />
                  </div>
                </div>
              </div>

              {/* Банк вопросов */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Банк вопросов ({questions.length})
                  </h2>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleJsonExport}
                      className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
                    >
                      Экспорт JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowJsonImport(true)}
                      className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
                    >
                      Импорт JSON
                    </button>
                  </div>
                </div>

                {questions.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-500">
                    Вопросы ещё не добавлены
                  </p>
                ) : (
                  <div className="space-y-4">
                    {questions.map((question, qIndex) => (
                      <div
                        key={qIndex}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                      >
                        <div className="mb-3 flex items-start justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            Вопрос #{qIndex + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeQuestion(qIndex)}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Удалить
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600">
                              Текст вопроса
                            </label>
                            <textarea
                              value={question.text}
                              onChange={(e) =>
                                updateQuestion(qIndex, 'text', e.target.value)
                              }
                              rows={2}
                              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600">
                              Тип вопроса
                            </label>
                            <div className="mt-1 flex gap-4">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name={`type-${qIndex}`}
                                  checked={question.type === 'single'}
                                  onChange={() =>
                                    updateQuestion(qIndex, 'type', 'single')
                                  }
                                  className="mr-2"
                                />
                                <span className="text-sm">Один ответ</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name={`type-${qIndex}`}
                                  checked={question.type === 'multiple'}
                                  onChange={() =>
                                    updateQuestion(qIndex, 'type', 'multiple')
                                  }
                                  className="mr-2"
                                />
                                <span className="text-sm">Несколько ответов</span>
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600">
                              Варианты ответов
                            </label>
                            <div className="mt-1 space-y-2">
                              {question.options.map((option, oIndex) => (
                                <div key={oIndex} className="flex items-center gap-2">
                                  <input
                                    type={question.type === 'single' ? 'radio' : 'checkbox'}
                                    name={`correct-${qIndex}`}
                                    checked={question.correct.includes(oIndex)}
                                    onChange={() =>
                                      toggleCorrect(qIndex, oIndex)
                                    }
                                    className="h-4 w-4"
                                  />
                                  <input
                                    type="text"
                                    value={option}
                                    onChange={(e) =>
                                      updateOption(qIndex, oIndex, e.target.value)
                                    }
                                    className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                                    placeholder={`Вариант ${oIndex + 1}`}
                                  />
                                  {question.options.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeOption(qIndex, oIndex)
                                      }
                                      className="text-sm text-red-600 hover:text-red-800"
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => addOption(qIndex)}
                                className="text-xs text-[#5858E2] hover:text-[#4a4ac9]"
                              >
                                + Добавить вариант
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600">
                              Пояснение к ответу
                            </label>
                            <textarea
                              value={question.explanation}
                              onChange={(e) =>
                                updateQuestion(qIndex, 'explanation', e.target.value)
                              }
                              rows={2}
                              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                              placeholder="Объяснение правильного ответа (необязательно)"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Кнопка добавления вопроса под списком */}
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="rounded-lg bg-[#5858E2] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#4a4ac9]"
                  >
                    + Добавить вопрос
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Настройки квалификационной работы */}
          {challengeType === 'WORK' && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Настройки квалификационной работы
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Инструкция для супервизоров
                  </label>
                  <textarea
                    value={workSettings.instructions}
                    onChange={(e) =>
                      setWorkSettings({
                        ...workSettings,
                        instructions: e.target.value,
                      })
                    }
                    rows={4}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                    placeholder="Опишите инструкцию для супервизоров по проверке работы..."
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Количество проверок
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={workSettings.requiredReviews}
                      onChange={(e) =>
                        setWorkSettings({
                          ...workSettings,
                          requiredReviews: parseInt(e.target.value) || 1,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Положительных решений
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={workSettings.reviewsToPass}
                      onChange={(e) =>
                        setWorkSettings({
                          ...workSettings,
                          reviewsToPass: parseInt(e.target.value) || 1,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Цена проверки (₽)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={workSettings.reviewPrice}
                      onChange={(e) =>
                        setWorkSettings({
                          ...workSettings,
                          reviewPrice: parseInt(e.target.value) || 0,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                    />
                    <p className="mt-1 text-xs text-gray-500">Оплата супервизору за проверку</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Настройки урока */}
          {challengeType === 'LESSON' && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Настройки урока
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Контент урока (HTML)
                  </label>
                  <textarea
                    value={lessonSettings.content}
                    onChange={(e) =>
                      setLessonSettings({
                        ...lessonSettings,
                        content: e.target.value,
                      })
                    }
                    rows={12}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                    placeholder="<h2>Заголовок урока</h2><p>Текст урока...</p>"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Поддерживается HTML: заголовки, параграфы, списки, ссылки, видео (YouTube/Vimeo embed)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Настройки вопросника */}
          {challengeType === 'QUESTIONNAIRE' && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Настройки вопросника
                </h2>
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Вопросов в пуле
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={questionnaireSettings.questionsPool.length}
                      disabled
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Добавьте вопросы ниже</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Сколько вопросов в попытке
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={questionnaireSettings.questionsCount}
                      onChange={(e) =>
                        setQuestionnaireSettings({
                          ...questionnaireSettings,
                          questionsCount: parseInt(e.target.value) || 1,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Лимит времени (мин)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={questionnaireSettings.timeLimit}
                      onChange={(e) =>
                        setQuestionnaireSettings({
                          ...questionnaireSettings,
                          timeLimit: parseInt(e.target.value) || 0,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                    />
                    <p className="mt-1 text-xs text-gray-500">0 = без лимита</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Оплата супервизору (₽)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={questionnaireSettings.reviewPrice}
                      onChange={(e) =>
                        setQuestionnaireSettings({
                          ...questionnaireSettings,
                          reviewPrice: parseInt(e.target.value) || 0,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Количество проверок
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={questionnaireSettings.requiredReviews}
                      onChange={(e) =>
                        setQuestionnaireSettings({
                          ...questionnaireSettings,
                          requiredReviews: parseInt(e.target.value) || 1,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Положительных решений
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={questionnaireSettings.reviewsToPass}
                      onChange={(e) =>
                        setQuestionnaireSettings({
                          ...questionnaireSettings,
                          reviewsToPass: parseInt(e.target.value) || 1,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                    />
                  </div>
                </div>

                {/* Инструкции */}
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Инструкция для психолога
                    </label>
                    <textarea
                      value={questionnaireSettings.instructionsForPsychologist}
                      onChange={(e) =>
                        setQuestionnaireSettings({
                          ...questionnaireSettings,
                          instructionsForPsychologist: e.target.value,
                        })
                      }
                      rows={4}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                      placeholder="Инструкция для психолога перед началом прохождения вопросника..."
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Эта инструкция будет показана психологу перед началом тестирования
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Инструкция для супервизора
                    </label>
                    <textarea
                      value={questionnaireSettings.instructionsForSupervisor}
                      onChange={(e) =>
                        setQuestionnaireSettings({
                          ...questionnaireSettings,
                          instructionsForSupervisor: e.target.value,
                        })
                      }
                      rows={4}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                      placeholder="Инструкция для супервизора по проверке ответов..."
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Эта инструкция будет показана супервизору при проверке работы
                    </p>
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Вопросы ({questionnaireSettings.questionsPool.length})
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const json = JSON.stringify({ questionsPool: questionnaireSettings.questionsPool }, null, 2);
                          navigator.clipboard.writeText(json);
                          alert('JSON скопирован в буфер обмена');
                        }}
                        className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
                      >
                        Экспорт JSON
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowQuestionnaireJsonImport(true)}
                        className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
                      >
                        Импорт JSON
                      </button>
                    </div>
                  </div>

                  {questionnaireSettings.questionsPool.length === 0 ? (
                    <p className="py-8 text-center text-sm text-gray-500">
                      Вопросы ещё не добавлены
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {questionnaireSettings.questionsPool.map((q, index) => (
                        <div key={index} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                          <span className="text-sm font-medium text-gray-500 w-8">#{index + 1}</span>
                          <input
                            type="text"
                            value={q}
                            onChange={(e) => {
                              const newQuestions = [...questionnaireSettings.questionsPool];
                              newQuestions[index] = e.target.value;
                              setQuestionnaireSettings({
                                ...questionnaireSettings,
                                questionsPool: newQuestions,
                              });
                            }}
                            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setQuestionnaireSettings({
                                ...questionnaireSettings,
                                questionsPool: questionnaireSettings.questionsPool.filter((_, i) => i !== index),
                              });
                            }}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Удалить
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Форма добавления вопроса */}
                  {showQuestionInput && (
                    <div className="mt-3 flex items-center gap-3 rounded-lg border border-[#5858E2] bg-blue-50 p-3">
                      <span className="text-sm font-medium text-gray-500 w-8">
                        #{questionnaireSettings.questionsPool.length + 1}
                      </span>
                      <input
                        type="text"
                        value={newQuestionText}
                        onChange={(e) => setNewQuestionText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newQuestionText.trim()) {
                            setQuestionnaireSettings({
                              ...questionnaireSettings,
                              questionsPool: [...questionnaireSettings.questionsPool, newQuestionText.trim()],
                            });
                            setNewQuestionText('');
                            setShowQuestionInput(false);
                          } else if (e.key === 'Escape') {
                            setShowQuestionInput(false);
                            setNewQuestionText('');
                          }
                        }}
                        placeholder="Введите текст вопроса..."
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newQuestionText.trim()) {
                            setQuestionnaireSettings({
                              ...questionnaireSettings,
                              questionsPool: [...questionnaireSettings.questionsPool, newQuestionText.trim()],
                            });
                            setNewQuestionText('');
                            setShowQuestionInput(false);
                          }
                        }}
                        className="rounded-lg bg-[#5858E2] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#4a4ac9]"
                      >
                        Добавить
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowQuestionInput(false);
                          setNewQuestionText('');
                        }}
                        className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
                      >
                        Отмена
                      </button>
                    </div>
                  )}

                  {/* Кнопка добавления вопроса под списком */}
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowQuestionInput(true);
                        setNewQuestionText('');
                      }}
                      className="rounded-lg bg-[#5858E2] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#4a4ac9]"
                    >
                      + Добавить вопрос
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Кнопки действий */}
          <div className="flex items-center justify-end gap-3">
            <Link
              href="/admin/challenges"
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              Отмена
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-[#5858E2] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9] disabled:opacity-50"
            >
              {isSubmitting ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
        </form>

        {/* Модальное окно импорта JSON для тестов */}
        {showJsonImport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-2xl rounded-xl bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Импорт вопросов из JSON
              </h3>
              <textarea
                value={jsonImportText}
                onChange={(e) => setJsonImportText(e.target.value)}
                rows={15}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                placeholder='{"questionsPool": [...]}'
              />
              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowJsonImport(false);
                    setJsonImportText('');
                  }}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleJsonImport}
                  className="rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]"
                >
                  Импорт
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно импорта JSON для вопросника */}
        {showQuestionnaireJsonImport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-2xl rounded-xl bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Импорт вопросов из JSON
              </h3>
              <p className="mb-3 text-sm text-gray-600">
                Вставьте JSON с вопросами. Поддерживаются форматы:
              </p>
              <ul className="mb-4 list-inside list-disc text-xs text-gray-500">
                <li>Массив строк: <code className="bg-gray-100 px-1 py-0.5 rounded">["Вопрос 1", "Вопрос 2"]</code></li>
                <li>Объект с questionsPool: <code className="bg-gray-100 px-1 py-0.5 rounded">{"{ questionsPool: [...] }"}</code></li>
              </ul>
              <textarea
                value={questionnaireJsonText}
                onChange={(e) => setQuestionnaireJsonText(e.target.value)}
                rows={15}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                placeholder='["Вопрос 1", "Вопрос 2", ...]'
              />
              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuestionnaireJsonImport(false);
                    setQuestionnaireJsonText('');
                  }}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleQuestionnaireJsonImport}
                  className="rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]"
                >
                  Импорт
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}