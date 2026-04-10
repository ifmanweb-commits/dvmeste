'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCertificatesList, deleteCertificate } from '@/lib/actions/certificates';
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
  const [certificates, setCertificates] = useState<CertificateWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadCertificates();
  }, []);

  async function loadCertificates() {
    setLoading(true);
    const result = await getCertificatesList();
    setCertificates(result || []);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Вы уверены, что хотите удалить этот сертификат?')) return;
    
    setDeletingId(id);
    await deleteCertificate(id);
    await loadCertificates();
    setDeletingId(null);
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse h-8 w-48 bg-gray-200 rounded mb-4"></div>
        <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Выданные сертификаты</h1>
        <Link
          href="/admin/certificate-templates"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Управление шаблонами
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
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
            {certificates.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Сертификаты ещё не выдавались.
                </td>
              </tr>
            ) : (
              certificates.map((certificate) => (
                <tr key={certificate.id}>
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
                    <div className="text-sm font-mono text-gray-900">{certificate.verificationCode}</div>
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
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Просмотр
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(certificate.id)}
                      disabled={deletingId === certificate.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      {deletingId === certificate.id ? 'Удаление...' : 'Удалить'}
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