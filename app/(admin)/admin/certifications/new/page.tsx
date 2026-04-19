'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Award,
  BookOpen,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface Challenge {
  id: string;
  slug: string;
  title: string;
  type: 'TEST' | 'WORK' | 'LESSON' | 'QUESTIONNAIRE';
  isActive: boolean;
}

interface Requirement {
  challengeId: string;
  order: number;
}

interface CertificateTemplate {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

interface Award {
  id: string;
  name: string;
  type: 'CERTIFICATE' | 'BADGE';
  isPublic: boolean;
  certificateTemplateId: string | null;
  awardText: string | null;
}

export default function NewCertificationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoadingChallenges, setIsLoadingChallenges] = useState(true);
  const [certificateTemplates, setCertificateTemplates] = useState<CertificateTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  // Награды
  const [awards, setAwards] = useState<Award[]>([]);
  const [isLoadingAwards, setIsLoadingAwards] = useState(true);
  const [selectedAwardId, setSelectedAwardId] = useState<string>('');

  // Основная информация
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugEdited, setIsSlugEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isPublic, setIsPublic] = useState(false);
  const [level, setLevel] = useState<number | ''>('');
  const [order, setOrder] = useState(0);

  // Шаблон сертификата (выбирается из награды)
  const [certificateTemplateId, setCertificateTemplateId] = useState<string>('');

  // Требования
  const [requirements, setRequirements] = useState<Requirement[]>([]);

  // Таймер для скрытия сообщения
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

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
          console.warn('Не удалось загрузить шаблоны сертификатов');
          return;
        }
        const data = await response.json();
        setCertificateTemplates(data);
      } catch (err: any) {
        console.warn('Не удалось загрузить шаблоны сертификатов:', err.message);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, []);

  // Загрузка списка наград
  useEffect(() => {
    const fetchAwards = async () => {
      try {
        const response = await fetch('/api/admin/awards');
        if (!response.ok) {
          throw new Error('Ошибка при загрузке наград');
        }
        const data = await response.json();
        setAwards(data);
      } catch (err: any) {
        console.error('Error fetching awards:', err);
      } finally {
        setIsLoadingAwards(false);
      }
    };

    fetchAwards();
  }, []);

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
  const generateSlug = (text: string) => {
    return transliterate(text);
  };

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
    setMessage(null);

    // Создаем FormData для отправки
    const formData = new FormData();
    formData.append('slug', slug);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('isActive', isActive ? 'on' : 'off');
    formData.append('isPublic', isPublic ? 'on' : 'off');
    formData.append('level', level === '' ? '' : String(level));
    formData.append('order', String(order));
    formData.append('awardId', selectedAwardId || '');
    requirements.filter(r => r.challengeId).forEach((req, index) => {
      formData.append(`requirements[${index}][challengeId]`, req.challengeId);
      formData.append(`requirements[${index}][order]`, String(req.order));
    });

    try {
      const response = await fetch('/api/admin/certifications', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при сохранении');
      }

      setMessage({ type: 'success', text: 'Сертификация успешно создана' });
      router.push('/admin/certifications');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = `
    w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 
    transition-all outline-none focus:border-[#5858E2] focus:ring-4 focus:ring-[#5858E2]/10
  `;

  const labelClasses = "flex items-center text-sm font-medium text-gray-700 mb-1.5";

  return (
    <div className="w-full">
      {/* Заголовок раздела */}
      <div className="mb-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            type="button"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Создать сертификацию</h1>
            <p className="text-gray-500 mt-1">Управление испытаниями и сертификациями</p>
          </div>
        </div>
      </div>

      {/* Сообщения системы */}
      {message && (
        <div className={`mb-6 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
            : 'bg-rose-50 border-rose-100 text-rose-700'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {/* Основная информация */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Award className="w-4 h-4 text-gray-400" /> Основная информация
            </h2>
          </div>
          <div className="p-6 space-y-6">
            {/* Выбор награды */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Награда</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Выберите награду
                </label>
                <select
                  value={selectedAwardId}
                  onChange={(e) => {
                    setSelectedAwardId(e.target.value);
                    const selected = awards.find(a => a.id === e.target.value);
                    if (selected) {
                      setIsPublic(selected.isPublic);
                      if (selected.certificateTemplateId) {
                        setCertificateTemplateId(selected.certificateTemplateId);
                      }
                    }
                  }}
                  className={inputClasses}
                >
                  <option value="">Не выбрано</option>
                  {awards.map((award) => (
                    <option key={award.id} value={award.id}>
                      {award.name} ({award.type === 'CERTIFICATE' ? 'Сертификат' : 'Ачивка'})
                    </option>
                  ))}
                </select>
                {isLoadingAwards && (
                  <p className="mt-1 text-xs text-gray-500">Загрузка наград...</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Выберите награду из списка. Награды создаются в разделе "Награды"
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>
                  Название *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={handleTitleChange}
                  className={inputClasses}
                  required
                />
              </div>

              <div>
                <label className={labelClasses}>
                  Slug *
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={handleSlugChange}
                  className={`font-mono ${inputClasses}`}
                  required
                />
                {!isSlugEdited && (
                  <p className="mt-1 text-xs text-gray-500">
                    Генерируется автоматически из названия
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className={labelClasses}>
                Описание
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={inputClasses}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClasses}>
                  Уровень квалификации
                </label>
                <input
                  type="number"
                  min="0"
                  value={level}
                  onChange={(e) => setLevel(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className={inputClasses}
                  placeholder="Не указано"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Оставьте пустым, если не повышает уровень
                </p>
              </div>

              <div>
                <label className={labelClasses}>
                  Порядок
                </label>
                <input
                  type="number"
                  min="0"
                  value={order}
                  onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                  className={inputClasses}
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center cursor-pointer">
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
        </section>

        {/* Требования */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gray-400" /> Требования (испытания)
            </h2>
            <button
              type="button"
              onClick={addRequirement}
              className="flex items-center gap-1.5 rounded-lg bg-[#5858E2]/10 px-3 py-1.5 text-xs font-medium text-[#5858E2] transition-colors hover:bg-[#5858E2]/20"
            >
              <Plus className="w-3.5 h-3.5" />
              Добавить требование
            </button>
          </div>

          <div className="p-6">
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
                        className="rounded p-1.5 text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveRequirement(index, 'down')}
                        disabled={index === requirements.length - 1}
                        className="rounded p-1.5 text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRequirement(index)}
                        className="rounded p-1.5 text-red-500 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
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
        </section>

        {/* Кнопки действий */}
        <div className="flex items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <Link
            href="/admin/certifications"
            className="px-6 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Отмена
          </Link>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-2.5 rounded-lg bg-[#5858E2] text-sm font-medium text-white hover:bg-[#4a4ac9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#5858E2]/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Сохранить
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-100">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}