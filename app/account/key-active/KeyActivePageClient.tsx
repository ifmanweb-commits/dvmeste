'use client';

import { useState } from 'react';
import { VenetianMask, Users, BookOpen, Award } from 'lucide-react';
import Link from 'next/link';

interface PreviewAction {
  type: string;
  label: string;
  description: string;
}

interface Course {
  id: string;
  title: string;
  shortTitle: string;
  description?: string | null;
}

interface UserCourse {
  courseId: string;
  status: 'enrolled' | 'graduated';
  course: Course;
}

interface Challenge {
  id: string;
  title: string;
  slug: string;
  type: string;
  test?: {
    id: string;
    title: string;
  } | null;
}

interface SecretPage {
  id: string;
  title: string;
  slug: string;
}

interface KeyActivePageClientProps {
  userId: string;
  initialUserCourses: UserCourse[];
  allCourses: Course[];
  challengesByCourse: Record<string, { enrolled: string[]; graduated: string[] }>;
  challengesMap: string;
  accessibleSecretPages: SecretPage[];
  hasSecretCatalogAccess: boolean;
}

export default function KeyActivePageClient({
  userId,
  initialUserCourses,
  allCourses,
  challengesByCourse,
  challengesMap,
  accessibleSecretPages,
  hasSecretCatalogAccess,
}: KeyActivePageClientProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{
    actions: PreviewAction[];
    keyId: string;
  } | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
    executedActions?: string[];
  } | null>(null);

  const challenges = new Map(JSON.parse(challengesMap)) as Map<string, Challenge>;

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPreview(null);
    setPreviewError(null);
    setResult(null);

    try {
      const response = await fetch('/api/key-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (response.ok) {
        setPreview({
          actions: data.actions,
          keyId: data.keyId,
        });
      } else {
        setPreviewError(data.error || 'Ошибка проверки ключа');
      }
    } catch (error) {
      setPreviewError('Произошла ошибка при проверке ключа');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    setActivating(true);
    setResult(null);

    try {
      const response = await fetch('/api/key-activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          executedActions: data.executedActions,
        });
        setCode('');
        setPreview(null);
      } else {
        setResult({
          success: false,
          error: data.error || 'Ошибка активации ключа',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        error: 'Произошла ошибка при активации ключа',
      });
    } finally {
      setActivating(false);
    }
  };

  const hasAnyPrivileges =
    initialUserCourses.length > 0 ||
    accessibleSecretPages.length > 0 ||
    hasSecretCatalogAccess;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Заголовок страницы */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Ключи</h1>
        </div>

        {/* Форма активации ключей */}
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Активация ключа</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            {!preview ? (
              <form onSubmit={handlePreview} className="space-y-4">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                    Код ключа
                  </label>
                  <input
                    type="text"
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="KEY-XXXX-XXXX"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Введите код ключа, который вы получили
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !code.trim()}
                  className="w-full rounded-lg bg-[#5858E2] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Проверка...' : 'Проверить ключ'}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-3">
                    Этот ключ выполнит следующие действия:
                  </p>
                  <ul className="space-y-2">
                    {preview.actions.map((action, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 rounded-lg bg-gray-50 px-3 py-2"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#5858E2]/10 text-[#5858E2] text-xs font-medium">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{action.label}</p>
                          {action.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{action.description}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setPreview(null);
                      setCode('');
                    }}
                    className="flex-1 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Назад
                  </button>
                  <button
                    type="button"
                    onClick={handleActivate}
                    disabled={activating}
                    className="flex-1 rounded-lg bg-[#5858E2] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {activating ? 'Активация...' : 'Активировать'}
                  </button>
                </div>
              </div>
            )}

            {(previewError || result) && (
              <div
                className={`mt-6 rounded-lg p-4 ${
                  result?.success
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                {result?.success ? (
                  <>
                    <p className="text-sm font-medium text-green-800">{result.message}</p>
                    {result.executedActions && result.executedActions.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-green-700 mb-1">
                          Выполненные действия:
                        </p>
                        <ul className="text-xs text-green-600 space-y-1">
                          {result.executedActions.map((action, index) => (
                            <li key={index}>• {action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm font-medium text-red-800">
                    {result?.error || previewError}
                  </p>
                )}
              </div>
            )}
            </div>
          </div>
        </section>

        {/* Курсы и испытания */}
        {initialUserCourses.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Курсы и испытания</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {initialUserCourses.map((userCourse) => {
                const access = challengesByCourse[userCourse.courseId] as { enrolled: string[]; graduated: string[] } | undefined;
                const challengeIds =
                  userCourse.status === 'enrolled' ? access?.enrolled : access?.graduated;

                if (!challengeIds || challengeIds.length === 0) return null;

                const courseChallenges = challengeIds
                  .map((id) => challenges.get(id))
                  .filter((c): c is Challenge => !!c);

                if (courseChallenges.length === 0) return null;

                return (
                  <div
                    key={userCourse.courseId}
                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                  >
                    {/* Заголовок курса со статусом */}
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#5858E2]/10 to-[#4a4ac9]/10">
                          <BookOpen className="h-7 w-7 text-[#5858E2]" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {userCourse.course.title}
                          </h3>
                          {userCourse.course.description && (
                            <p className="mt-1 text-sm text-gray-600">
                              {userCourse.course.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                            userCourse.status === 'enrolled'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {userCourse.status === 'enrolled' ? 'Ученик' : 'Выпускник'}
                        </span>
                      </div>
                    </div>

                    {/* Список тестов */}
                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Award className="h-5 w-5 text-[#5858E2]" />
                        <h4 className="text-base font-semibold text-gray-900">
                          Тренировочные тесты
                        </h4>
                      </div>
                      <p className="mb-4 text-sm text-gray-500">
                        Можно проходить без ограничений для тренировки
                      </p>
                      <div className="space-y-2">
                        {courseChallenges.map((challenge) => (
                          <div
                            key={challenge.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg bg-gray-50 px-4 py-3"
                          >
                            <div className="flex items-center gap-3">
                              <Award className="h-5 w-5 text-gray-400" />
                              <span className="font-medium text-gray-900">
                                {challenge.test?.title || challenge.title}
                              </span>
                            </div>
                            <Link
                              href={`/account/training/test/${challenge.slug}`}
                              className="w-full sm:w-auto rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9] text-center"
                            >
                              Пройти
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Секретные страницы */}
        {accessibleSecretPages.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Секретные страницы</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {accessibleSecretPages.map((page) => (
                <Link
                  key={page.id}
                  href={`/secret-page/${page.slug}`}
                  className="group flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-[#5858E2]/40"
                >
                  <div className="shrink-0">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-[#5858E2]/10 to-[#4a4ac9]/10">
                      <VenetianMask className="h-8 w-8 text-[#5858E2]" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#5858E2]">
                      {page.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Секретный каталог */}
        {hasSecretCatalogAccess && (
          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Секретный каталог</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Link
                href="/account/secret-catalog"
                className="group flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-[#5858E2]/40"
              >
                <div className="shrink-0">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-[#A7FF5A]/20 to-[#7acc3c]/20">
                    <Users className="h-8 w-8 text-[#3d8b1c]" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#5858E2]">
                    Секретный каталог
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Доступ к закрытым материалам каталога
                  </p>
                </div>
              </Link>
            </div>
          </section>
        )}

        {/* Пустое состояние */}
        {!hasAnyPrivileges && (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
            <Award className="mx-auto h-14 w-14 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Нет доступных привилегий
            </h3>
            <p className="mt-2 text-gray-500">
              Активируйте ключ, чтобы получить доступ к специальным материалам
            </p>
          </div>
        )}
      </div>
    </div>
  );
}