'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageForm from './PageForm';
import { createPage, updatePage } from '@/lib/actions/admin-pages';

interface PageFormContainerProps {
  initialData?: any;
}

export default function PageFormContainer({ initialData = {} }: PageFormContainerProps) {
  const router = useRouter();
  
  // Состояния для всех полей формы
  const [adminTitle, setAdminTitle] = useState(initialData.adminTitle || '');
  const [slug, setSlug] = useState(initialData.slug || '');
  const [content, setContent] = useState(initialData.content || '');
  const [metaTitle, setMetaTitle] = useState(initialData.metaTitle || '');
  const [metaDescription, setMetaDescription] = useState(initialData.metaDescription || '');
  const [metaKeywords, setMetaKeywords] = useState(initialData.metaKeywords || '');
  const [metaRobots, setMetaRobots] = useState(initialData.metaRobots || 'index, follow');
  const [template, setTemplate] = useState(initialData.template || 'text');
  const [isPublished, setIsPublished] = useState(initialData.isPublished || false);
  const [customHead, setCustomHead] = useState(initialData.customHead || '');
  
  // Состояние для файлов
  const [images, setImages] = useState<string[]>(initialData.images || []);
  
  // Состояния для UI
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const pageId = initialData.id || `temp-${Date.now()}`;
  const tempKey = !initialData.id ? `temp-${Date.now()}` : null;

  const handleFilesChange = (urls: string[]) => {
    console.log('🔥 Container: files changed', urls);
    setImages(urls);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const formData = {
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
      tempKey,
    };

    try {
      let result;
      if (initialData.id) {
        result = await updatePage(initialData.slug, formData);
      } else {
        result = await createPage(formData);
      }

      if (result.success) {
        setSuccess('Страница сохранена');
        setTimeout(() => {
          router.push('/admin/pages');
        }, 500);
      } else {
        setError(result.error || 'Ошибка при сохранении');
        setSaving(false);
      }
    } catch (err: any) {
      setError(err.message || 'Неизвестная ошибка');
      setSaving(false);
    }
  };

  // Все обработчики изменений полей
  const handleAdminTitleChange = (value: string) => setAdminTitle(value);
  const handleSlugChange = (value: string) => setSlug(value);
  const handleContentChange = (value: string) => setContent(value);
  const handleMetaTitleChange = (value: string) => setMetaTitle(value);
  const handleMetaDescriptionChange = (value: string) => setMetaDescription(value);
  const handleMetaKeywordsChange = (value: string) => setMetaKeywords(value);
  const handleMetaRobotsChange = (value: string) => setMetaRobots(value);
  const handleTemplateChange = (value: string) => setTemplate(value);
  const handlePublishedChange = (value: boolean) => setIsPublished(value);
  const handleCustomHeadChange = (value: string) => setCustomHead(value);

  return (
    <PageForm
      // Данные
      initialData={initialData}
      adminTitle={adminTitle}
      slug={slug}
      content={content}
      metaTitle={metaTitle}
      metaDescription={metaDescription}
      metaKeywords={metaKeywords}
      metaRobots={metaRobots}
      template={template}
      isPublished={isPublished}
      customHead={customHead}
      images={images}
      pageId={pageId}
      tempKey={tempKey}
      
      // Состояния UI
      saving={saving}
      error={error}
      success={success}
      
      // Обработчики
      onAdminTitleChange={handleAdminTitleChange}
      onSlugChange={handleSlugChange}
      onContentChange={handleContentChange}
      onMetaTitleChange={handleMetaTitleChange}
      onMetaDescriptionChange={handleMetaDescriptionChange}
      onMetaKeywordsChange={handleMetaKeywordsChange}
      onMetaRobotsChange={handleMetaRobotsChange}
      onTemplateChange={handleTemplateChange}
      onPublishedChange={handlePublishedChange}
      onCustomHeadChange={handleCustomHeadChange}
      onFilesChange={handleFilesChange}
      onSubmit={handleSubmit}
    />
  );
}