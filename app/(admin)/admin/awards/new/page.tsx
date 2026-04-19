'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import HorNav from '@/app/(admin)/admin/certifications/HorNav';

interface CertificateTemplate {
  id: string;
  name: string;
  slug: string;
}

export default function NewAwardPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [awardType, setAwardType] = useState<'CERTIFICATE' | 'BADGE'>('CERTIFICATE');
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);

  // Загрузка шаблонов сертификатов
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/admin/certificate-templates');
        if (!response.ok) {
          throw new Error('Ошибка при загрузке шаблонов');
        }
        const data = await response.json();
        setTemplates(data);
      } catch (err: any) {
        console.error('Error fetching templates:', err);
      }
    };

    fetchTemplates();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch('/api/admin/awards', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка при создании');
      }

      router.push('/admin/awards');
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <Link href="/admin/awards" className="text-sm text-gray-500 hover:text-gray-700">
              ← Назад к наградам
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">Создать награду</h1>
          </div>
        </div>
        <HorNav />
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-red-800">{error}</div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Название награды *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
            placeholder="Например: Сертификат за прохождение курса"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Тип награды *</label>
          <div className="mt-2 flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="type"
                value="CERTIFICATE"
                checked={awardType === 'CERTIFICATE'}
                onChange={() => setAwardType('CERTIFICATE')}
                className="h-4 w-4 text-[#5858E2] focus:ring-[#5858E2]"
              />
              <span className="ml-2 text-gray-700">Сертификат</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="type"
                value="BADGE"
                checked={awardType === 'BADGE'}
                onChange={() => setAwardType('BADGE')}
                className="h-4 w-4 text-[#5858E2] focus:ring-[#5858E2]"
              />
              <span className="ml-2 text-gray-700">Ачивка (значок)</span>
            </label>
          </div>
        </div>

        {awardType === 'CERTIFICATE' && (
          <div>
            <label htmlFor="certificateTemplateId" className="block text-sm font-medium text-gray-700">
              Шаблон сертификата
            </label>
            <select
              id="certificateTemplateId"
              name="certificateTemplateId"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
            >
              <option value="">Не выбрано</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.slug})
                </option>
              ))}
            </select>
            {templates.length === 0 && (
              <p className="mt-1 text-xs text-gray-500">Шаблоны не загружены или отсутствуют</p>
            )}
          </div>
        )}

        {awardType === 'BADGE' && (
          <div>
            <label htmlFor="badge" className="block text-sm font-medium text-gray-700">
              Файл значка
            </label>
            <input
              type="file"
              id="badge"
              name="badge"
              accept="image/*"
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-[#5858E2] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#4a4ac9]"
            />
          </div>
        )}

        {awardType === 'CERTIFICATE' && (
          <div>
            <label htmlFor="awardText" className="block text-sm font-medium text-gray-700">
              Текст на сертификате
            </label>
            <textarea
              id="awardText"
              name="awardText"
              rows={3}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
              placeholder="Текст, который будет написан на сертификате"
            />
          </div>
        )}

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isPublic"
            name="isPublic"
            className="h-4 w-4 rounded border-gray-300 text-[#5858E2] focus:ring-[#5858E2]"
          />
          <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
            Публичная награда (отображается в профиле)
          </label>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-[#5858E2] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Создание...' : 'Создать награду'}
          </button>
          <Link
            href="/admin/awards"
            className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Отмена
          </Link>
        </div>
      </form>
    </div>
  );
}