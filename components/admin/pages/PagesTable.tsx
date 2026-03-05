'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { deletePage } from '@/lib/actions/admin-pages';


interface Page {
  id: string;
  slug: string;
  adminTitle: string;
  template: string;
  isPublished: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  createdAt: string;
}

interface PagesTableProps {
  pages: Page[];
}

export function PagesTable({ pages }: PagesTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredPages = pages.filter(page =>
    page.adminTitle.toLowerCase().includes(search.toLowerCase()) ||
    page.slug.toLowerCase().includes(search.toLowerCase())
  );

  const getTemplateName = (template: string) => {
    const templates: Record<string, string> = {
      text: 'Текстовая',
      landing: 'Лендинг',
      blank: 'Пустой шаблон'
    };
    return templates[template] || template;
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Удалить страницу "${title}"? Это действие необратимо.`)) {
      return;
    }

    setDeletingId(id);
    
    try {
      const result = await deletePage(id);
      
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || 'Ошибка при удалении');
      }
    } catch (err) {
      alert('Ошибка при удалении');
    } finally {
      setDeletingId(null);
    }
  };

  const hasSeo = (page: Page) => {
    return !!(page.metaTitle || page.metaDescription);
  };

  return (
    <div className="space-y-4">
      {/* Поиск */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по названию или slug..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2"
        />
        <Link
          href="/admin/pages/new"
          className="px-4 py-2 bg-[#5858E2] text-white rounded-lg hover:bg-[#4848d0] transition-colors"
        >
          Новая страница
        </Link>
      </div>

      {/* Таблица */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Название
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Шаблон
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SEO
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPages.map((page) => (
              <tr key={page.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {page.adminTitle}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  /{page.slug}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getTemplateName(page.template)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {hasSeo(page) ? (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      Заполнено
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                      Нет
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {page.isPublished ? (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      Опубликовано
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                      Черновик
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/${page.slug}`}
                      target="_blank"
                      className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-100"
                      title="Просмотр"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                    <Link
                      href={`/admin/pages/${page.id}/edit`}
                      className="text-[#5858E2] hover:text-[#4848d0] p-1 rounded hover:bg-[#5858E2]/10"
                      title="Редактировать"
                    >
                      <Pencil className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(page.id, page.adminTitle)}
                      disabled={deletingId === page.id}
                      className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 disabled:opacity-50"
                      title="Удалить"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredPages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Страницы не найдены</p>
          </div>
        )}
      </div>
    </div>
  );
}