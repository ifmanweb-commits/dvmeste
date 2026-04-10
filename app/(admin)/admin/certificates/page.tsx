'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCertificatesList, deleteCertificate, CertificatesListResult } from '@/lib/actions/certificates';
import { CertificateWithUser } from '@/lib/actions/certificates';
import { User } from '@prisma/client';

/**
 * Получить полное ФИО пользователя
 */
function getFullFio(user: Pick<User, 'fullName' | 'firstName' | 'lastName' | 'middleName'> | null): string {
  if (!user) return '';
  
  // Если есть firstName и lastName, используем их
  if (user.firstName && user.lastName) {
    const parts = [user.lastName, user.firstName];
    if (user.middleName) {
      parts.push(user.middleName);
    }
    return parts.join(' ');
  }
  
  // Фоллбэк на fullName
  return user.fullName || '';
}

export default function CertificatesPage() {
  const [data, setData] = useState<CertificatesListResult>({ items: [], total: 0, pages: 0, currentPage: 1 });
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const currentPage = data.currentPage;
  const totalPages = data.pages;

  useEffect(() => {
    loadCertificates(1);
  }, []);

  async function loadCertificates(page: number = 1) {
    setLoading(true);
    const result = await getCertificatesList({ page, limit: 20 });
    setData(result);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Вы уверены, что хотите удалить этот сертификат?')) return;
    
    setDeletingId(id);
    await deleteCertificate(id);
    await loadCertificates(currentPage);
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
        <h1 className="text-3xl font-bold text-gray-900">Выданные сертификаты</h1>
        <p className="text-gray-500 mt-1">Управление выданными сертификатами</p>
        <div className="mt-2 text-sm text-gray-600">
          Всего: {data.total}
        </div>
      </div>

      {/* Кнопка управления шаблонами */}
      <div className="mb-6">
        <Link
          href="/admin/certificate-templates"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#5858E2] text-white rounded-lg hover:bg-[#4a4ac7] transition-colors font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
          Управление шаблонами
        </Link>
      </div>

      {/* Таблица сертификатов */}
      {data.items.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-600 mb-2">Сертификаты ещё не выдавались.</p>
          <p className="text-sm text-gray-500">
            Сначала создайте шаблон сертификата в разделе «Управление шаблонами»
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ФИО получателя
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Шаблон
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Проверочный код
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата выдачи
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.items.map((certificate) => (
                  <tr key={certificate.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getFullFio(certificate.user)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{certificate.user?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{certificate.template?.name || '—'}</div>
                      <div className="text-xs text-gray-500">{certificate.template?.slug}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded inline-block">
                        {certificate.verificationCode}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(certificate.issuedAt).toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {certificate.imageUrl && (
                        <a
                          href={certificate.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#5858E2] hover:text-[#4a4ac7] font-medium mr-4"
                        >
                          Просмотр
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(certificate.id)}
                        disabled={deletingId === certificate.id}
                        className="text-red-600 hover:text-red-700 disabled:opacity-50 font-medium"
                      >
                        {deletingId === certificate.id ? 'Удаление...' : 'Удалить'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Пагинация */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Страница <span className="font-medium text-gray-900">{currentPage}</span> из{' '}
                <span className="font-medium text-gray-900">{totalPages}</span>
                <span className="ml-2 text-gray-400">(всего: {data.total})</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => loadCertificates(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  ← Назад
                </button>
                <button
                  onClick={() => loadCertificates(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Вперёд →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}