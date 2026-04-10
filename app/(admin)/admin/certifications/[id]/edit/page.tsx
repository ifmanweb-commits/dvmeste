'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Challenge {
  id: string;
  slug: string;
  title: string;
  type: 'TEST' | 'WORK' | 'LESSON' | 'QUESTIONNAIRE';
  isActive: boolean;
}

interface Requirement {
  id?: string;
  challengeId: string;
  order: number;
  challenge?: Challenge;
}

interface CertificateTemplate {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

interface Certification {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  awardText: string | null;
  isActive: boolean;
  level: number | null;
  order: number;
  rewardType: string;
  badgeUrl: string | null;
  certificateTemplateId: string | null;
  certificateTemplate: CertificateTemplate | null;
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
  const [awardText, setAwardText] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [level, setLevel] = useState<number | ''>('');
  const [order, setOrder] = useState(0);

  // Настройки награды
  const [rewardType, setRewardType] = useState<'certificate' | 'badge'>('certificate');
  const [certificateTemplateId, setCertificateTemplateId] = useState<string>('');
  const [badgeFile, setBadgeFile] = useState<File | null>(null);
  const [badgePreview, setBadgePreview] = useState<string | null>(null);
  const [existingBadgeUrl, setExistingBadgeUrl] = useState<string | null>(null);

  // Шаблоны сертификатов
  const [certificateTemplates, setCertificateTemplates] = useState<CertificateTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

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

  // Загрузка списка шаблонов сертификатов
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/admin/certificate-templates');
        if (!response.ok) {
          throw new Error('Ошибка при загрузке шаблонов');
        }
        const data = await response.json();
        setCertificateTemplates(data);
      } catch (err: any) {
        console.error('Error fetching certificate templates:', err);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, []);

  // Обработка загрузки файла ачивки
  const handleBadgeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBadgeFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBadgePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setBadgeFile(null);
      setBadgePreview(null);
    }
  };

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
        setAwardText(data.awardText || '');
        setIsActive(data.isActive);
        setLevel(data.level ?? '');
        setOrder(data.order ?? 0);
        setRewardType((data.rewardType as 'certificate' | 'badge') || 'certificate');
        setCertificateTemplateId(data.certificateTemplateId || '');
        setExistingBadgeUrl(data.badgeUrl || null);
        if (data.badgeUrl) {
          setBadgePreview(data.badgeUrl);
        }
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

    // Создаем FormData для отправки файла ачивки
    const formData = new FormData();
    formData.append('slug', slug);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('awardText', awardText);
    formData.append('isActive', isActive ? 'on' : 'off');
    formData.append('level', level === '' ? '' : String(level));
    formData.append('order', String(order));
    formData.append('rewardType', rewardType);
    formData.append('certificateTemplateId', certificateTemplateId || '');
    if (badgeFile) {
      formData.append('badge', badgeFile);
    }
    requirements.filter(r => r.challengeId).forEach((req, index) => {
      formData.append(`requirements[${index}][challengeId]`, req.challengeId);
      formData.append(`requirements[${index}][order]`, String(req.order));
    });

    try {
      const response = await fetch(`/api/admin/certifications/${id}`, {
        method: 'PUT',
        body: formData,
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
              {/* Настройки награды */}
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <h3 className="mb-3 text-sm font-semibold text-gray-700">Настройки награды</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Тип награды
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="rewardType"
                        value="certificate"
                        checked={rewardType === 'certificate'}
                        onChange={(e) => setRewardType(e.target.value as 'certificate' | 'badge')}
                        className="h-4 w-4 text-[#5858E2] focus:ring-[#5858E2]"
                      />
                      <span className="text-sm text-gray-700">Сертификат</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="rewardType"
                        value="badge"
                        checked={rewardType === 'badge'}
                        onChange={(e) => setRewardType(e.target.value as 'certificate' | 'badge')}
                        className="h-4 w-4 text-[#5858E2] focus:ring-[#5858E2]"
                      />
                      <span className="text-sm text-gray-700">Ачивка</span>
                    </label>
                  </div>
                </div>

                {rewardType === 'certificate' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Шаблон сертификата
                      </label>
                      <select
                        value={certificateTemplateId}
                        onChange={(e) => setCertificateTemplateId(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                      >
                        <option value="">Выберите шаблон</option>
                        {certificateTemplates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                      {isLoadingTemplates && (
                        <p className="mt-1 text-xs text-gray-500">Загрузка шаблонов...</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Текст для сертификата
                      </label>
                      <textarea
                        value={awardText}
                        onChange={(e) => setAwardText(e.target.value)}
                        rows={2}
                        placeholder="Например: уровень квалификации 1"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Текст, который будет подставлен в сертификат после слова "Присваивается"
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Изображение ачивки
                    </label>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleBadgeFileChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                    />
                    {badgePreview && (
                      <div className="mt-3">
                        <img
                          src={badgePreview}
                          alt="Preview"
                          className="h-24 w-24 object-contain rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                    {existingBadgeUrl && !badgePreview && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-2">Текущее изображение:</p>
                        <img
                          src={existingBadgeUrl}
                          alt="Current badge"
                          className="h-24 w-24 object-contain rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
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
                          {challenge.title} ({challenge.type === 'TEST' ? 'Тест' :
                           challenge.type === 'WORK' ? 'Работа' :
                           challenge.type === 'QUESTIONNAIRE' ? 'Вопросник' : 'Урок'})
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