'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageSEOForm } from './PageSEOForm';
import { PageSettingsForm } from './PageSettingsForm';
import EntityFilesField from '@/components/files/EntityFilesField';
import { RESERVED_SLUGS, makeSlugSafe } from '@/lib/constants/reserved-slugs';
import { createPage, updatePage } from '@/lib/actions/admin-pages';

interface PageFormProps {
  initialData?: any;
}

export default function PageForm({ initialData = {} }: PageFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('main');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Основные поля
  const [adminTitle, setAdminTitle] = useState(initialData.adminTitle || '');
  const [slug, setSlug] = useState(initialData.slug || '');
  const [content, setContent] = useState(initialData.content || '');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  
  // SEO поля
  const [metaTitle, setMetaTitle] = useState(initialData.metaTitle || '');
  const [metaDescription, setMetaDescription] = useState(initialData.metaDescription || '');
  const [metaKeywords, setMetaKeywords] = useState(initialData.metaKeywords || '');
  const [metaRobots, setMetaRobots] = useState(initialData.metaRobots || 'index, follow');
  
  // Настройки
  const [template, setTemplate] = useState(initialData.template || 'text');
  const [isPublished, setIsPublished] = useState(initialData.isPublished || false);
  const [customHead, setCustomHead] = useState(initialData.customHead || '');
  
  // Файлы
  const [images, setImages] = useState(initialData.images || []);
  const pageId = initialData.id || `temp-${Date.now()}`;

  // Генерируем ключ для файлов
  const tempKey = !initialData.id ? `temp-${Date.now()}` : null;
  const entityKey = initialData.id || tempKey;

  // Генерация slug из названия
  // Функция транслитерации кириллицы в латиницу
  const transliterate = (text: string): string => {
    const map: Record<string, string> = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
      'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
      'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
      'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
      'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
      
      'А': 'a', 'Б': 'b', 'В': 'v', 'Г': 'g', 'Д': 'd', 'Е': 'e', 'Ё': 'e',
      'Ж': 'zh', 'З': 'z', 'И': 'i', 'Й': 'y', 'К': 'k', 'Л': 'l', 'М': 'm',
      'Н': 'n', 'О': 'o', 'П': 'p', 'Р': 'r', 'С': 's', 'Т': 't', 'У': 'u',
      'Ф': 'f', 'Х': 'kh', 'Ц': 'ts', 'Ч': 'ch', 'Ш': 'sh', 'Щ': 'sch',
      'Ъ': '', 'Ы': 'y', 'Ь': '', 'Э': 'e', 'Ю': 'yu', 'Я': 'ya',
      
      ' ': '-', '_': '-', '/': '-', '\\': '-',
    };

    return text
      .split('')
      .map(char => map[char] || char)
      .join('')
      .replace(/-+/g, '-') // заменяем несколько дефисов подряд на один
      .replace(/^-|-$/g, '') // убираем дефисы в начале и конце
      .toLowerCase();
  };

  const generateSlug = (title: string): string => {
    if (!title) return '';
    
    // Транслитерируем и приводим к безопасному виду
    return transliterate(title)
      .replace(/[^a-z0-9-]/g, '') // оставляем только латиницу, цифры и дефисы
      .replace(/-+/g, '-') // убираем повторяющиеся дефисы
      .replace(/^-|-$/g, ''); // убираем дефисы в начале и конце
  };


  useEffect(() => {
    // Если это существующая страница
    if (initialData.slug && initialData.adminTitle) {
      const generatedFromTitle = generateSlug(initialData.adminTitle);
      // Если slug отличается от сгенерированного - значит его редактировали вручную
      if (initialData.slug !== generatedFromTitle) {
        setIsSlugManuallyEdited(true);
      }
    }
  }, [initialData]);


  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setAdminTitle(newTitle);
    
    // Генерируем slug только если:
    // 1. Не было ручного редактирования
    // 2. И slug сейчас пустой (для новой страницы)
    if (!isSlugManuallyEdited || !slug) {
      const newSlug = generateSlug(newTitle);
      setSlug(newSlug);
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSlug = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '') // только латиница, цифры, дефис
      .replace(/-+/g, '-')        // убираем повторяющиеся дефисы
      .replace(/^-|-$/g, '');     // убираем дефисы в начале и конце
    
    setSlug(newSlug);
    
    // Если поле не пустое - включаем флаг ручного редактирования
    if (newSlug) {
      setIsSlugManuallyEdited(true);
    } else {
      // Если стёрли всё - сбрасываем флаг и генерируем заново
      setIsSlugManuallyEdited(false);
      setSlug(generateSlug(adminTitle));
    }
  };

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    // Проверяем и корректируем slug ДО отправки
    let finalSlug = slug;
    if (RESERVED_SLUGS.includes(slug)) {
      finalSlug = makeSlugSafe(slug);
      setSlug(finalSlug); // обновляем UI
    }

    const formData = {
      adminTitle,
      slug: finalSlug,
      content,
      metaTitle,
      metaDescription,
      metaKeywords,
      metaRobots,
      template,
      isPublished,
      customHead,
      images,
      tempKey,
    };

    try {
      let result;
      
      if (initialData.id) {
        // Редактирование
        result = await updatePage(initialData.slug, formData);
      } else {
        // Создание
        result = await createPage(formData);
      }

      if (result.success) {
        setSuccess('Страница сохранена');
        setTimeout(() => {
          router.push('/admin/pages');
        }, 500); // 500ms достаточно
      } else {
        // Ошибка от сервера
        setError(result.error || 'Ошибка при сохранении');
        setSaving(false);
      }
    } catch (err: any) {
      // Неожиданная ошибка (сеть, и т.д.)
      setError(err.message || 'Неизвестная ошибка');
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'main', label: 'Основное' },
    { id: 'seo', label: 'SEO' },
    { id: 'content', label: 'Контент' },
    { id: 'settings', label: 'Настройки' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Вкладки */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#5858E2] text-[#5858E2]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Сообщения */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {/* Основное */}
      {activeTab === 'main' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название (для админки) *
            </label>
            <input
              type="text"
              value={adminTitle}
              onChange={handleTitleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
              placeholder="О проекте, Контакты..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Адрес страницы (slug) *
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">/</span>
              <input
                type="text"
                value={slug}
                onChange={handleSlugChange}
                required
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
                placeholder="about, contacts"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Только латинские буквы, цифры и дефисы
            </p>
          </div>
        </div>
      )}

      {/* SEO */}
      {activeTab === 'seo' && (
        <PageSEOForm
          metaTitle={metaTitle}
          metaDescription={metaDescription}
          metaKeywords={metaKeywords}
          metaRobots={metaRobots}
          onChange={(field, value) => {
            switch (field) {
              case 'metaTitle': setMetaTitle(value); break;
              case 'metaDescription': setMetaDescription(value); break;
              case 'metaKeywords': setMetaKeywords(value); break;
              case 'metaRobots': setMetaRobots(value); break;
            }
          }}
        />
      )}

      {/* Контент */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Содержимое страницы
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={20}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
              placeholder="HTML-код страницы..."
            />
          </div>

          <EntityFilesField
            scope="pages"
            entityKey={`page-${pageId}`}
            title="Файлы страницы"
            hint="Загрузите изображения или другие файлы для этой страницы"
            initialUrls={images}
            onInsertLink={(file) => {
              // Вставка ссылки в текст
              const link = `<a href="${file.url}">${file.name}</a>`;
              setContent((prev: string) => prev + '\n' + link);
            }}
            onInsertImage={(file) => {
              // Вставка изображения
              const img = `<img src="${file.url}" alt="${file.name}" style="max-width:100%;">`;
              setContent((prev: string) => prev + '\n' + img);
            }}
          />
        </div>
      )}

      {/* Настройки */}
      {activeTab === 'settings' && (
        <PageSettingsForm
          template={template}
          isPublished={isPublished}
          customHead={customHead}
          onTemplateChange={setTemplate}
          onPublishedChange={setIsPublished}
          onCustomHeadChange={setCustomHead}
        />
      )}

      {/* Кнопки */}
      <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-[#5858E2] text-white rounded-lg hover:bg-[#4848d0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </form>
  );
}