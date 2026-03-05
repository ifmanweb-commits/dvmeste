'use client';

interface PageSEOFormProps {
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  metaRobots?: string | null;
  onChange: (field: string, value: string) => void;
}

export function PageSEOForm({ 
  metaTitle = '', 
  metaDescription = '', 
  metaKeywords = '', 
  metaRobots = '',
  onChange 
}: PageSEOFormProps) {
  // Преобразуем null в пустую строку для input
  const safeMetaTitle = metaTitle || '';
  const safeMetaDescription = metaDescription || '';
  const safeMetaKeywords = metaKeywords || '';
  const safeMetaRobots = metaRobots || '';

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Meta Title (заголовок в поиске)
        </label>
        <input
          type="text"
          value={safeMetaTitle}
          onChange={(e) => onChange('metaTitle', e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
          placeholder="О проекте | Давай вместе"
        />
        <p className="text-xs text-gray-500 mt-1">
          Рекомендуемая длина: 50-60 символов
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Meta Description (описание в поиске)
        </label>
        <textarea
          value={safeMetaDescription}
          onChange={(e) => onChange('metaDescription', e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
          placeholder="Краткое описание страницы для поисковиков..."
        />
        <p className="text-xs text-gray-500 mt-1">
          Рекомендуемая длина: 150-160 символов
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Meta Keywords (ключевые слова)
        </label>
        <input
          type="text"
          value={safeMetaKeywords}
          onChange={(e) => onChange('metaKeywords', e.target.value)}
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
          value={safeMetaRobots}
          onChange={(e) => onChange('metaRobots', e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
        >
          <option value="index, follow">index, follow</option>
          <option value="noindex, follow">noindex, follow</option>
          <option value="index, nofollow">index, nofollow</option>
          <option value="noindex, nofollow">noindex, nofollow</option>
        </select>
      </div>
    </div>
  );
}