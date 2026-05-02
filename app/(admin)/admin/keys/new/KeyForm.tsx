'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { createKey, updateKeyAction } from '../actions';
import { KeyAction } from '../actions';

interface Page {
  id: string;
  title: string;
  slug: string;
}

interface Course {
  id: string;
  title: string;
  slug: string;
}

interface Challenge {
  id: string;
  title: string;
  slug: string;
  type: string;
}

interface Award {
  id: string;
  name: string;
  type: 'CERTIFICATE' | 'BADGE';
}

interface KeyFormProps {
  pages: Page[];
  courses: Course[];
  challenges: Challenge[];
  initialData?: {
    id?: string;
    code: string;
    maxUses: number;
    expiresAt?: string | null;
    isActive: boolean;
    actionsJson: { actions: KeyAction[] };
  };
}

const ACTION_TYPES = [
  { value: 'grant_page_access', label: 'Доступ к странице' },
  { value: 'revoke_page_access', label: 'Снять доступ к странице' },
  { value: 'enroll_course', label: 'Зачислить на курс' },
  { value: 'unenroll_course', label: 'Отчислить с курса' },
  { value: 'complete_challenge', label: 'Зачесть испытание' },
  { value: 'add_balance', label: 'Начислить рубли' },
  { value: 'subtract_balance', label: 'Списать рубли' },
  { value: 'add_attempts', label: 'Дать попытки' },
  { value: 'give_award', label: 'Выдать награду' },
  { value: 'revoke_award', label: 'Отобрать награду' },
] as const;

export default function KeyForm({ pages, courses, challenges, initialData }: KeyFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [code, setCode] = useState(initialData?.code || '');
  const [maxUses, setMaxUses] = useState(initialData?.maxUses?.toString() || '1');
  const [expiresAt, setExpiresAt] = useState(
    initialData?.expiresAt ? new Date(initialData.expiresAt).toISOString().split('T')[0] : ''
  );
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [actions, setActions] = useState<KeyAction[]>(
    initialData?.actionsJson?.actions || []
  );
  const [awards, setAwards] = useState<Award[]>([]);

  // Загрузка наград типа BADGE
  useEffect(() => {
    const fetchAwards = async () => {
      try {
        const response = await fetch('/api/admin/awards');
        if (response.ok) {
          const data = await response.json();
          // Фильтруем только BADGE
          setAwards(data.filter((a: Award) => a.type === 'BADGE'));
        }
      } catch (err) {
        console.error('Error fetching awards:', err);
      }
    };

    fetchAwards();
  }, []);

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      if (i > 0 && i % 4 === 0) result += '-';
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(result);
  };

  const addAction = () => {
    setActions([...actions, { type: 'grant_page_access' }]);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const updateAction = (index: number, field: keyof KeyAction, value: any) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], [field]: value };
    setActions(newActions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(formRef.current!);
    formData.set('actionsJson', JSON.stringify({ actions }));
    
    if (initialData?.id) {
      formData.set('id', initialData.id);
      await updateKeyAction(formData);
    } else {
      await createKey(formData);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      {/* Основные поля */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Основная информация</h2>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Код ключа
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                placeholder="KEY-XXXX-XXXX"
                required
              />
              <button
                type="button"
                onClick={generateCode}
                className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Сгенерировать
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Максимум использований
            </label>
            <input
              type="number"
              name="maxUses"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
              min="0"
              placeholder="0 = безлимит"
            />
            <p className="mt-1 text-xs text-gray-500">0 = безлимитное использование</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Истекает
            </label>
            <input
              type="date"
              name="expiresAt"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
            />
            <p className="mt-1 text-xs text-gray-500">Оставьте пустым для бессрочного ключа</p>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-[#5858E2] focus:ring-[#5858E2]"
              />
              <span className="text-sm font-medium text-gray-700">Активен</span>
            </label>
          </div>
        </div>
      </div>

      {/* Действия */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Действия</h2>
          <button
            type="button"
            onClick={addAction}
            className="rounded-lg bg-[#5858E2] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#4a4ac9]"
          >
            + Добавить действие
          </button>
        </div>

        {actions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            Нет действий. Добавьте хотя бы одно действие.
          </p>
        ) : (
          <div className="space-y-4">
            {actions.map((action, index) => (
              <div
                key={index}
                className="rounded-lg border border-neutral-200 p-4 bg-neutral-50"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Тип действия
                    </label>
                    <select
                      value={action.type}
                      onChange={(e) =>
                        updateAction(index, 'type', e.target.value as KeyAction['type'])
                      }
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                    >
                      {ACTION_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAction(index)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium mt-5"
                  >
                    Удалить
                  </button>
                </div>

                {/* Параметры действия */}
                {action.type === 'grant_page_access' || action.type === 'revoke_page_access' ? (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Страница
                    </label>
                    <select
                      value={action.pageId || ''}
                      onChange={(e) => updateAction(index, 'pageId', e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                      required
                    >
                      <option value="">Выберите страницу</option>
                      {pages.map((page) => (
                        <option key={page.id} value={page.id}>
                          {page.title} ({page.slug})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : action.type === 'enroll_course' || action.type === 'unenroll_course' ? (
                  <>
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Курс
                      </label>
                      <select
                        value={action.courseId || ''}
                        onChange={(e) => updateAction(index, 'courseId', e.target.value)}
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                        required
                      >
                        <option value="">Выберите курс</option>
                        {courses.map((course) => (
                          <option key={course.id} value={course.id}>
                            {course.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    {action.type === 'enroll_course' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Статус
                        </label>
                        <select
                          value={action.status || 'enrolled'}
                          onChange={(e) =>
                            updateAction(index, 'status', e.target.value as 'enrolled' | 'graduated')
                          }
                          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                        >
                          <option value="enrolled">Учащийся (enrolled)</option>
                          <option value="graduated">Выпускник (graduated)</option>
                        </select>
                      </div>
                    )}
                  </>
                ) : action.type === 'complete_challenge' || action.type === 'add_attempts' ? (
                  <>
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Испытание
                      </label>
                      <select
                        value={action.challengeId || ''}
                        onChange={(e) => updateAction(index, 'challengeId', e.target.value)}
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                        required
                      >
                        <option value="">Выберите испытание</option>
                        {challenges.map((challenge) => (
                          <option key={challenge.id} value={challenge.id}>
                            {challenge.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    {action.type === 'add_attempts' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Количество попыток
                        </label>
                        <input
                          type="number"
                          value={action.quantity?.toString() || ''}
                          onChange={(e) =>
                            updateAction(index, 'quantity', parseInt(e.target.value, 10))
                          }
                          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                          min="1"
                          required
                        />
                      </div>
                    )}
                  </>
                ) : action.type === 'add_balance' || action.type === 'subtract_balance' ? (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Сумма (в рублях)
                    </label>
                    <input
                      type="number"
                      value={action.amount?.toString() || ''}
                      onChange={(e) =>
                        updateAction(index, 'amount', parseInt(e.target.value, 10))
                      }
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                      min="1"
                      placeholder="100"
                      required
                    />
                  </div>
                ) : action.type === 'give_award' || action.type === 'revoke_award' ? (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      {action.type === 'revoke_award' ? 'Награда для отзыва' : 'Награда (ачивка)'}
                    </label>
                    <select
                      value={action.awardId || ''}
                      onChange={(e) => updateAction(index, 'awardId', e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
                      required
                    >
                      <option value="">Выберите награду</option>
                      {awards.map((award) => (
                        <option key={award.id} value={award.id}>
                          {award.name}
                        </option>
                      ))}
                    </select>
                    {awards.length === 0 && (
                      <p className="mt-1 text-xs text-orange-600">
                        Нет доступных наград типа "Ачивка". Создайте награду в разделе "Награды".
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          className="rounded-lg bg-[#5858E2] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#4a4ac9]"
        >
          {initialData ? 'Сохранить изменения' : 'Создать ключ'}
        </button>
        <Link href="/admin/keys" className="text-sm text-gray-500 hover:text-gray-700">
          Отмена
        </Link>
      </div>
    </form>
  );
}
