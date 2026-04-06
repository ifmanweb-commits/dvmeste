'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Challenge {
  id: string;
  slug: string;
  title: string;
  type: 'TEST' | 'WORK';
  isActive: boolean;
}

interface Requirement {
  id?: string;
  challengeId: string;
  order: number;
  challenge?: Challenge;
}

interface Certification {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  isActive: boolean;
  level: number | null;
  order: number;
  requirements: Requirement[];
}

export default function EditCertificationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoadingChallenges, setIsLoadingChallenges] = useState(true);

  // Основная информация
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [level, setLevel] = useState<number | ''>('');
  const [order, setOrder] = useState(0);

  // Требования
  const [requirements, setRequirements] = useState<Requirement[]>([]);

  // Загрузка списка испытаний
  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const response = await fetch('/api/admin/challenges');
        if (!response.ok) {
          throw new Error('Ошибка при загрузке испытаний');
        }
        const data = await response.json();
        setChallenges(data);
      } catch (err: any) {
        console.error('Error fetching challenges:', err);
      } finally {
        setIsLoadingChallenges(false);
      }
    };

    fetchChallenges();
  }, []);

  // Загрузка данных сертификации
  useEffect(() => {
    const fetchCertification = async () => {
      try {
        const response = await fetch(`/api/admin/certifications/${id}`);
        if (!response.ok) {
          throw new Error('Ошибка при загрузке данных');
        }
        const data: Certification = await response.json();

        setTitle(data.title);
        setSlug(data.slug);
        setDescription(data.description || '');
        setIsActive(data.isActive);
        setLevel(data.level ?? '');
        setOrder(data.order ?? 0);
        setRequirements(data.requirements || []);

        setIsLoading(false);
      } catch (err: any) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchCertification();
  }, [id]);

  // Генерация slug из названия
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9а-яё\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
  };

  // Добавление требования
  const addRequirement = () => {
    if (challenges.length === 0) return;
    const nextOrder = requirements.length > 0 
      ? Math.max(...requirements.map(r => r.order)) + 1 
      : 0;
    setRequirements([
      ...requirements,
      { challengeId: '', order: nextOrder },
    ]);
  };

  // Удаление требования
  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  // Обновление требования
  const updateRequirement = (index: number, challengeId: string) => {
    const newRequirements = [...requirements];
    newRequirements[index].challengeId = challengeId;
    setRequirements(newRequirements);
  };

  // Перемещение требования
  const moveRequirement = (index: number, direction: 'up' | 'down') => {
    const newRequirements = [...requirements];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= newRequirements.length) return;
    
    [newRequirements[index], newRequirements[newIndex]] = 
    [newRequirements[newIndex], newRequirements[index]];
    
    // Обновляем порядок
    newRequirements.forEach((req, i) => {
      req.order = i;
    });
    
    setRequirements(newRequirements);
  };

  // Сохранение
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/certifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug,
            title,
            description,
            isActive,
            level: level === '' ? null : level,
            order,
            requirements: requirements.filter(r => r.challengeId),
          }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при сохранении');
      }

      router.push('/admin/certifications');
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-500">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-gray-900 sm:text-2xl">
            Редактировать сертификацию
          </h1>
          <Link
            href="/admin/certifications"
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
                  onChange={(e) => setSlug(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                  required
                />
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
                    Уровень квалификации
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={level}
                    onChange={(e) => setLevel(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                    placeholder="Не указано"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Оставьте пустым, если не повышает уровень
                  </p>
                </div>

                <div className="w-32">
                  <label className="block text-sm font-medium text-gray-700">
                    Порядок
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={order}
                    onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                  />
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
            </div>
          </div>

          {/* Требования */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Требования (испытания)
              </h2>
              <button
                type="button"
                onClick={addRequirement}
                className="rounded-lg bg-[#5858E2] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#4a4ac9]"
              >
                + Добавить требование
              </button>
            </div>

            {requirements.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">
                Требования ещё не добавлены
              </p>
            ) : (
              <div className="space-y-3">
                {requirements.map((req, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
                  >
                    <span className="text-sm font-medium text-gray-500 w-8">
                      #{index + 1}
                    </span>
                    
                    <select
                      value={req.challengeId}
                      onChange={(e) => updateRequirement(index, e.target.value)}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                    >
                      <option value="">Выберите испытание</option>
                      {challenges.map((challenge) => (
                        <option key={challenge.id} value={challenge.id}>
                          {challenge.title} ({challenge.type === 'TEST' ? 'Тест' : 'Работа'})
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveRequirement(index, 'up')}
                        disabled={index === 0}
                        className="rounded p-1 text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveRequirement(index, 'down')}
                        disabled={index === requirements.length - 1}
                        className="rounded p-1 text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRequirement(index)}
                        className="rounded p-1 text-red-500 hover:bg-red-100"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isLoadingChallenges && (
              <p className="py-4 text-center text-sm text-gray-500">
                Загрузка испытаний...
              </p>
            )}
          </div>

          {/* Кнопки действий */}
          <div className="flex items-center justify-end gap-3">
            <Link
              href="/admin/certifications"
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
      </div>
    </div>
  );
}