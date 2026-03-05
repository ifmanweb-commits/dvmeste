'use client';

interface PageSettingsFormProps {
  template: string;
  isPublished: boolean;
  customHead?: string | null;
  onTemplateChange: (value: string) => void;
  onPublishedChange: (checked: boolean) => void;
  onCustomHeadChange: (value: string) => void;
}

export function PageSettingsForm({
  template,
  isPublished,
  customHead = '',
  onTemplateChange,
  onPublishedChange,
  onCustomHeadChange
}: PageSettingsFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Шаблон страницы
        </label>
        <select
          value={template}
          onChange={(e) => onTemplateChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
        >
          <option value="text">Текстовая (стандартное оформление)</option>
          <option value="landing">Лендинг (свои стили, с меню и футером)</option>
          <option value="blank">Пустой шаблон (без меню и футера)</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          {template === 'text' && 'Обычный текст с оформлением сайта'}
          {template === 'landing' && 'Своя вёрстка, стили изолированы, меню и футер отображаются'}
          {template === 'blank' && 'Полностью пустая страница, только ваш HTML'}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isPublished"
          checked={isPublished}
          onChange={(e) => onPublishedChange(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-[#5858E2] focus:ring-[#5858E2]"
        />
        <label htmlFor="isPublished" className="font-medium text-gray-700">
          Опубликована на сайте
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Дополнительный код в &lt;head&gt;
        </label>
        <textarea
          value={customHead || ''}
          onChange={(e) => onCustomHeadChange(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
          placeholder="<link rel='stylesheet' href='...'> или <script>...</script>"
        />
        <p className="text-xs text-gray-500 mt-1">
          Будет вставлен в &lt;head&gt; страницы. Для лендингов стили лучше добавлять сюда.
        </p>
      </div>
    </div>
  );
}