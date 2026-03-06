'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageSEOForm } from './PageSEOForm';
import { PageSettingsForm } from './PageSettingsForm';
import FileManager from '@/components/files/FileManager';
import { RESERVED_SLUGS, makeSlugSafe } from '@/lib/constants/reserved-slugs';

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
  const [activeTab, setActiveTab] = useState('main');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  // Функция транслитерации (оставляем внутри, так как это чистая логика)
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

  const tabs = [
    { id: 'main', label: 'Основное' },
    { id: 'seo', label: 'SEO' },
    { id: 'content', label: 'Контент' },
    { id: 'settings', label: 'Настройки' },
  ];

  return (
    <form onSubmit={onSubmit} className="space-y-6">
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
              case 'metaTitle': onMetaTitleChange(value); break;
              case 'metaDescription': onMetaDescriptionChange(value); break;
              case 'metaKeywords': onMetaKeywordsChange(value); break;
              case 'metaRobots': onMetaRobotsChange(value); break;
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
              onChange={(e) => onContentChange(e.target.value)}
              rows={20}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
              placeholder="HTML-код страницы..."
            />
          </div>

          <FileManager
            scope="pages"
            entityKey={`page-${pageId}`}
            title="Файлы страницы"
            hint="Загрузите изображения или другие файлы для этой страницы"
            onFilesChange={onFilesChange}
          />
        </div>
      )}

      {/* Настройки */}
      {activeTab === 'settings' && (
        <PageSettingsForm
          template={template}
          isPublished={isPublished}
          customHead={customHead}
          onTemplateChange={onTemplateChange}
          onPublishedChange={onPublishedChange}
          onCustomHeadChange={onCustomHeadChange}
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