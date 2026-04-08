'use client'

import { UserAccessRecord } from "../actions";
import { revokeAccess } from "../actions";
import { useState } from "react";
import Link from "next/link";

interface AccessTableProps {
  accesses: UserAccessRecord[];
  currentPage: number;
  totalPages: number;
}

export default function AccessTable({ accesses, currentPage, totalPages }: AccessTableProps) {
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const handleRevoke = async (id: string) => {
    if (!confirm('Удалить доступ пользователю?')) {
      return;
    }
    setRevokingId(id);
    await revokeAccess(id);
    setRevokingId(null);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSourceLabel = (grantedBy: string) => {
    if (grantedBy.startsWith('admin_')) {
      return { label: 'Админ', color: 'bg-blue-100 text-blue-700' };
    }
    if (grantedBy.startsWith('key_')) {
      return { label: 'Ключ', color: 'bg-green-100 text-green-700' };
    }
    return { label: grantedBy, color: 'bg-gray-100 text-gray-700' };
  };

  if (accesses.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <p className="text-gray-500">Доступы ещё не выданы</p>
      </div>
    );
  }

  return (
    <div>
      {/* Таблица */}
      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Пользователь
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ресурс
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Кем выдано
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Дата выдачи
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Срок действия
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {accesses.map((access) => {
              const source = getSourceLabel(access.grantedBy);
              return (
                <tr key={access.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {access.user.fullName || access.user.email}
                    </div>
                    <div className="text-sm text-gray-500">
                      {access.user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {access.resourceType === 'page' ? (
                        <Link
                          href={`/admin/secret-pages`}
                          className="text-[#5858E2] hover:underline"
                        >
                          {access.resourceName}
                        </Link>
                      ) : (
                        access.resourceName
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {access.resourceType}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${source.color}`}>
                      {source.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(access.grantedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {access.expiresAt ? formatDate(access.expiresAt) : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleRevoke(access.id)}
                      disabled={revokingId === access.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      {revokingId === access.id ? '...' : 'Отозвать'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Link
              key={page}
              href={`?page=${page}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                page === currentPage
                  ? 'bg-[#5858E2] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {page}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}