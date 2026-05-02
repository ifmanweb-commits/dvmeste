'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createCertificateTemplate } from '@/lib/actions/certificate-templates';

export default function NewCertificateTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    try {
      const result = await createCertificateTemplate(formData);

      if (result.error) {
        setError(result.error);
        setLoading(false);
      } else {
        router.push('/admin/certificate-templates');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  }

  return (
    <div className="w-full">
      {/* Заголовок раздела */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Новый шаблон сертификата</h1>
        <p className="text-gray-500 mt-1">
          Загрузите фоновое изображение и настройте поля для генерации сертификата.
        </p>
      </div>

      <form className="max-w-2xl space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Название шаблона *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5858E2]/20 focus:border-[#5858E2]"
            placeholder="Например: Сертификат ПП-1"
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
            Slug (уникальный идентификатор) *
          </label>
          <input
            type="text"
            id="slug"
            name="slug"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5858E2]/20 focus:border-[#5858E2]"
            placeholder="pp-1-certificate"
          />
          <p className="mt-1 text-sm text-gray-500">
            Только латинские буквы, цифры и дефисы
          </p>
        </div>

        <div>
          <label htmlFor="background" className="block text-sm font-medium text-gray-700 mb-1">
            Фоновое изображение
          </label>
          <input
            type="file"
            id="background"
            name="background"
            ref={fileInputRef}
            accept="image/png,image/jpeg"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5858E2]/20 focus:border-[#5858E2]"
          />
          <p className="mt-1 text-sm text-gray-500">
            Рекомендуемый размер: 1200x800 или больше. Поддерживаются PNG и JPEG.
          </p>

          {previewUrl && (
            <div className="mt-4">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full h-auto max-h-64 rounded-lg border border-gray-200"
              />
            </div>
          )}
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            defaultChecked
            className="h-4 w-4 text-[#5858E2] border-gray-300 rounded focus:ring-[#5858E2]"
          />
          <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
            Активен (шаблон доступен для использования)
          </label>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-[#5858E2] text-white rounded-lg hover:bg-[#4a4ac7] disabled:opacity-50 transition-colors font-medium"
          >
            {loading ? 'Сохранение...' : 'Сохранить и продолжить'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}