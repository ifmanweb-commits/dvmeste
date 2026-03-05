"use client";

import { useState } from "react";
import { removeRole } from '@/lib/actions/admin-managers';
import { useRouter } from "next/navigation";

type Manager = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER';
  isActive: boolean;
  inCatalog: boolean;
};

interface ManagersTableProps {
  managers: Manager[];
  currentUserId?: string; // ID текущего админа, чтобы запретить саморедактирование
}

export function ManagersTable({ managers, currentUserId }: ManagersTableProps) {
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleRemoveRole = async (userId: string, userName: string) => {
    if (!confirm(`Снять права с ${userName}? Пользователь станет обычным участником.`)) return;

    setProcessingId(userId);
    setError("");

    try {
      // Используем Server Action вместо fetch
      await removeRole(userId);
      router.refresh(); // Обновляем данные
    } catch (err: any) {
      setError(err.message || "Ошибка при снятии прав");
    } finally {
      setProcessingId(null);
    }
  };

  if (managers.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
        <p className="text-gray-500">В команде пока никого нет</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      {error && (
        <div className="m-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <table className="w-full">
        <thead className="bg-gray-50 border-b border-neutral-200">
          <tr>
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Имя</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Email</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Роль</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Статус</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">В каталоге</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Действия</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {managers.map((manager) => {
            const isSelf = manager.id === currentUserId;
            
            return (
              <tr key={manager.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium">{manager.name}</td>
                <td className="px-6 py-4">{manager.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    manager.role === 'ADMIN' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {manager.role === 'ADMIN' ? 'Админ' : 'Менеджер'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    manager.isActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {manager.isActive ? 'Активен' : 'Не подтверждён'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {manager.inCatalog ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {!isSelf && (
                    <button
                      onClick={() => handleRemoveRole(manager.id, manager.name)}
                      disabled={processingId === manager.id}
                      className="text-xs text-red-600 hover:underline disabled:opacity-50"
                    >
                      {processingId === manager.id ? "Снятие..." : "Снять права"}
                    </button>
                  )}
                  {isSelf && (
                    <span className="text-xs text-gray-400">Это вы</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}