'use client'

import { useRouter } from 'next/navigation';

interface AccessFiltersProps {
  currentSearch: string;
  currentResourceType: string;
  currentResourceId: string;
  currentSource?: 'admin' | 'key';
  secretPages: { id: string; title: string; slug: string }[];
}

export default function AccessFilters({
  currentSearch,
  currentResourceType,
  currentResourceId,
  currentSource,
  secretPages
}: AccessFiltersProps) {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get('search') as string;
    const resourceType = formData.get('resourceType') as string;
    const resourceId = formData.get('resourceId') as string;
    const source = formData.get('source') as string;

    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (resourceType) params.set('resourceType', resourceType);
    if (resourceId) params.set('resourceId', resourceId);
    if (source) params.set('source', source);
    params.set('page', '1');

    router.push(`/admin/access?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/admin/access');
  };

  const hasFilters = currentSearch || currentResourceType || currentResourceId || currentSource;

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Поиск по email */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Поиск по email
          </label>
          <input
            type="email"
            name="search"
            id="search"
            defaultValue={currentSearch}
            placeholder="user@example.com"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
          />
        </div>

        {/* Тип ресурса */}
        <div>
          <label htmlFor="resourceType" className="block text-sm font-medium text-gray-700 mb-1">
            Тип ресурса
          </label>
          <select
            name="resourceType"
            id="resourceType"
            defaultValue={currentResourceType}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
          >
            <option value="">Все типы</option>
            <option value="page">Секретная страница</option>
            <option value="catalog">Секретный каталог</option>
          </select>
        </div>

        {/* Конкретный ресурс */}
        <div>
          <label htmlFor="resourceId" className="block text-sm font-medium text-gray-700 mb-1">
            Ресурс
          </label>
          <select
            name="resourceId"
            id="resourceId"
            defaultValue={currentResourceId}
            disabled={!currentResourceType}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2] disabled:bg-gray-100"
          >
            <option value="">Все ресурсы</option>
            {currentResourceType === 'page' && secretPages.map((page) => (
              <option key={page.id} value={page.id}>
                {page.title}
              </option>
            ))}
            {currentResourceType === 'catalog' && (
              <option value="secret-catalog">Секретный каталог</option>
            )}
          </select>
        </div>

        {/* Источник */}
        <div>
          <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
            Источник
          </label>
          <select
            name="source"
            id="source"
            defaultValue={currentSource}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
          >
            <option value="">Все источники</option>
            <option value="admin">Выдано админами</option>
            <option value="key">Выдано ключами</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="submit"
          className="rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]"
        >
          Применить фильтры
        </button>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            Сбросить фильтры
          </button>
        )}
      </div>
    </form>
  );
}