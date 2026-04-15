'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FileManager from '@/components/files/FileManager';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface PageFormProps {
  // Данные
  initialData?: any;
  adminTitle: string;
  slug: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  metaRobots: string;
  template: string;
  isPublished: boolean;
  customHead: string;
  images: string[];
  pageId: string;
  tempKey: string | null;
  
  // Состояния UI
  saving: boolean;
  error: string;
  success: string;
  
  // Обработчики
  onAdminTitleChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onMetaTitleChange: (value: string) => void;
  onMetaDescriptionChange: (value: string) => void;
  onMetaKeywordsChange: (value: string) => void;
  onMetaRobotsChange: (value: string) => void;
  onTemplateChange: (value: string) => void;
  onPublishedChange: (value: boolean) => void;
  onCustomHeadChange: (value: string) => void;
  onFilesChange: (urls: string[]) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export default function PageForm({
  // Данные
  initialData = {},
  adminTitle,
  slug,
  content,
  metaTitle,
  metaDescription,
  metaKeywords,
  metaRobots,
  template,
  isPublished,
  customHead,
  images,
  pageId,
  tempKey,
  
  // Состояния UI
  saving,
  error,
  success,
  
  // Обработчики
  onAdminTitleChange,
  onSlugChange,
  onContentChange,
  onMetaTitleChange,
  onMetaDescriptionChange,
  onMetaKeywordsChange,
  onMetaRobotsChange,
  onTemplateChange,
  onPublishedChange,
  onCustomHeadChange,
  onFilesChange,
  onSubmit
}: PageFormProps) {
  const router = useRouter();
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [seoExpanded, setSeoExpanded] = useState(false);

  // Функция транслитерации
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
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
  };

  const generateSlug = (title: string): string => {
    if (!title) return '';
    return transliterate(title)
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Определяем, был ли slug отредактирован вручную
  useEffect(() => {
    if (initialData.slug && initialData.adminTitle) {
      const generatedFromTitle = generateSlug(initialData.adminTitle);
      if (initialData.slug !== generatedFromTitle) {
        setIsSlugManuallyEdited(true);
      }
    }
  }, [initialData]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    onAdminTitleChange(newTitle);
    
    if (!isSlugManuallyEdited || !slug) {
      const newSlug = generateSlug(newTitle);
      onSlugChange(newSlug);
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSlug = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    onSlugChange(newSlug);
    
    if (newSlug) {
      setIsSlugManuallyEdited(true);
    } else {
      setIsSlugManuallyEdited(false);
      onSlugChange(generateSlug(adminTitle));
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
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

      {/* Основная информация - две колонки */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

      {/* Meta Title - на всю ширину */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Meta Title (заголовок в поиске)
        </label>
        <input
          type="text"
          value={metaTitle || ''}
          onChange={(e) => onMetaTitleChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
          placeholder="О проекте | Давай вместе"
        />
        <p className="text-xs text-gray-500 mt-1">
          Рекомендуемая длина: 50-60 символов
        </p>
      </div>

      {/* Дополнительный код в head - увеличенная высота */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Дополнительный код в {'<head>'}
        </label>
        <textarea
          value={customHead}
          onChange={(e) => onCustomHeadChange(e.target.value)}
          rows={6}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
          placeholder="<script>...</script>"
        />
        <p className="text-xs text-gray-500 mt-1">
          Например, скрипты аналитики, стили и т.д.
        </p>
      </div>

      {/* Содержимое страницы - на всю ширину, без уменьшения */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Содержимое страницы
        </label>
        <textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          rows={20}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
          placeholder="HTML-код страницы..."
        />
      </div>

      {/* FileManager */}
      <div>
        <FileManager
          scope="pages"
          entityKey={pageId}
          title="Файлы страницы"
          hint="Загрузите изображения или другие файлы для этой страницы"
          onFilesChange={onFilesChange}
        />
      </div>

      {/* Настройки - две колонки */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Шаблон
          </label>
          <select
            value={template}
            onChange={(e) => onTemplateChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
          >
            <option value="blank">Пустая (без обёртки)</option>
            <option value="landing">Лендинг</option>
            <option value="text">Текстовая</option>
          </select>
        </div>

        <div className="flex items-center gap-4 pt-6">
          <label className="inline-flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => onPublishedChange(e.target.checked)}
              className="h-5 w-5 rounded border-gray-300 text-[#5858E2] focus:ring-[#5858E2]"
            />
            <span className="text-base font-semibold text-gray-900">Опубликована на сайте</span>
          </label>
          {initialData.slug && (
            <a
              href={`/${initialData.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center p-2 text-gray-500 hover:text-[#5858E2] hover:bg-gray-100 rounded-lg transition-colors"
              title="Открыть страницу на сайте"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </a>
          )}
        </div>
      </div>

      {/* SEO аккордеон */}
      <div className="border border-gray-200 rounded-lg">
        <button
          type="button"
          onClick={() => setSeoExpanded(!seoExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <span className="font-medium text-gray-900">SEO настройки</span>
          {seoExpanded ? (
            <ChevronUp size={20} className="text-gray-500" />
          ) : (
            <ChevronDown size={20} className="text-gray-500" />
          )}
        </button>
        
        {seoExpanded && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Description
                </label>
                <textarea
                  value={metaDescription || ''}
                  onChange={(e) => onMetaDescriptionChange(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
                  placeholder="Краткое описание страницы для поисковиков..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Рекомендуемая длина: 150-160 символов
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Keywords
                  </label>
                  <input
                    type="text"
                    value={metaKeywords || ''}
                    onChange={(e) => onMetaKeywordsChange(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
                    placeholder="психология, консультация, помощь"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Через запятую, необязательно
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Robots (индексация)
                  </label>
                  <select
                    value={metaRobots || ''}
                    onChange={(e) => onMetaRobotsChange(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
                  >
                    <option value="index, follow">index, follow</option>
                    <option value="noindex, follow">noindex, follow</option>
                    <option value="index, nofollow">index, nofollow</option>
                    <option value="noindex, nofollow">noindex, nofollow</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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