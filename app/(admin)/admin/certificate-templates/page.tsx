'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCertificateTemplates, deleteCertificateTemplate } from '@/lib/actions/certificate-templates';
import { CertificateTemplate } from '@prisma/client';
import HorNav from '../certifications/HorNav';

export default function CertificateTemplatesPage() {
  const [templates, setTemplates] = useState<(CertificateTemplate & { _count: { certificates: number } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    setLoading(true);
    const result = await getCertificateTemplates();
    setTemplates(result || []);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Вы уверены, что хотите удалить этот шаблон?')) return;
    
    setDeletingId(id);
    await deleteCertificateTemplate(id);
    await loadTemplates();
    setDeletingId(null);
  }

  if (loading) {
    return (
      <div className="w-full">
        <div className="mb-6">
          <div className="animate-pulse h-8 w-48 bg-gray-200 rounded mb-2"></div>
          <div className="animate-pulse h-4 w-64 bg-gray-200 rounded"></div>
        </div>
        <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Заголовок раздела */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Шаблоны сертификатов</h1>
            <p className="text-gray-500 mt-1">Управление шаблонами сертификатов</p>
          </div>
          <Link
            href="/admin/certificate-templates/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#5858E2] text-white rounded-lg hover:bg-[#4a4ac7] transition-colors font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Создать шаблон
          </Link>
        </div>

        {/* Вкладки */}
        <HorNav />
      </div>

      {/* Таблица шаблонов */}
      <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
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
                Статус
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Выдано
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {templates.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  Шаблоны не найдены. Создайте первый шаблон.
                </td>
              </tr>
            ) : (
              templates.map((template) => (
                <tr key={template.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{template.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{template.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        template.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {template.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{template._count.certificates}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      href={`/admin/certificate-templates/${template.id}/edit`}
                      className="text-[#5858E2] hover:text-[#4a4ac7] font-medium mr-4"
                    >
                      Редактировать
                    </Link>
                    <button
                      onClick={() => handleDelete(template.id)}
                      disabled={deletingId === template.id}
                      className="text-red-600 hover:text-red-700 disabled:opacity-50 font-medium"
                    >
                      {deletingId === template.id ? 'Удаление...' : 'Удалить'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}