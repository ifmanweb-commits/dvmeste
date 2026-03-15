'use client'

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Pencil } from "lucide-react";

interface Article {
  id: string;
  title: string;
  slug: string;
  publishedAt: string | null;
  isPublished: boolean;
  moderationStatus: string;
  tags: string[];
  moderator: {
    id: string;
    fullName: string;
  } | null;
  author: {
    id: string;
    fullName: string;
  } | null;
}

interface ArticlesTableProps {
  articles: Article[];
}

export function ArticlesTable({ articles }: ArticlesTableProps) {
  const router = useRouter();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getPublishBadge = (isPublished: boolean, publishedAt: string | null) => {
    if (isPublished && publishedAt) {
      return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">На сайте</span>;
    }
    return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">Не опубликована</span>;
  };

  const getTagsDisplay = (tags: string[]) => {
    if (!tags || tags.length === 0) {
      return <span className="text-gray-400">Без тэгов</span>;
    }
    return (
      <span className="text-sm text-gray-700">
        {tags.join(', ')}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Заголовок
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Дата
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Автор
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Тэги
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Кто принял
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Публикация
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Действия
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {articles.map((article) => (
            <tr key={article.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <Link
                  href={`/admin/articles/${article.id}/edit`}
                  className="text-sm font-medium text-gray-900 hover:text-blue-600 cursor-pointer"
                >
                  {article.title}
                </Link>
                <div className="text-xs text-gray-500">
                  /articles/{article.slug}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(article.publishedAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {article.author?.fullName ||
                  <span className="text-gray-400">Без автора</span>
                }
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {getTagsDisplay(article.tags)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {article.moderator?.fullName || '—'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getPublishBadge(article.isPublished, article.publishedAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/articles/${article.slug}`}
                    target="_blank"
                    className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-100"
                    title="Просмотр"
                  >
                    <Eye className="w-5 h-5" />
                  </Link>
                  <Link
                    href={`/admin/articles/${article.id}/edit`}
                    className="text-[#5858E2] hover:text-[#4848d0] p-1 rounded hover:bg-[#5858E2]/10"
                    title="Редактировать"
                  >
                    <Pencil className="w-5 h-5" />
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {articles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Статьи не найдены</p>
        </div>
      )}
    </div>
  );
}