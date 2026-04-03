"use client";

import { useState } from "react";
import { updateUserRoles } from '@/lib/actions/admin-managers';
import { useRouter } from "next/navigation";

type Manager = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER';
  isActive: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isSupervisor: boolean;
};

interface ManagersTableProps {
  managers: Manager[];
  currentUserId?: string;
  isSuperAdmin?: boolean;
}

export function ManagersTable({ managers, currentUserId, isSuperAdmin }: ManagersTableProps) {
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  
  // Состояние чекбоксов для каждой строки
  const [checkboxStates, setCheckboxStates] = useState<Record<string, {
    isAdmin: boolean;
    isManager: boolean;
    isSupervisor: boolean;
  }>>(() => {
    const initial: Record<string, { isAdmin: boolean; isManager: boolean; isSupervisor: boolean }> = {};
    managers.forEach(m => {
      initial[m.id] = {
        isAdmin: m.isAdmin,
        isManager: m.isManager,
        isSupervisor: m.isSupervisor,
      };
    });
    return initial;
  });

  const handleCheckboxChange = (userId: string, field: 'isAdmin' | 'isManager' | 'isSupervisor', value: boolean) => {
    setCheckboxStates(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value,
      }
    }));
  };

  const handleSave = async (userId: string) => {
    setProcessingId(userId);
    setError("");

    try {
      const roles = checkboxStates[userId];
      await updateUserRoles(userId, roles);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Ошибка при сохранении прав");
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
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Права</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Статус</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Действия</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {managers.map((manager) => {
            const isSelf = manager.id === currentUserId;
            const state = checkboxStates[manager.id] || {
              isAdmin: manager.isAdmin,
              isManager: manager.isManager,
              isSupervisor: manager.isSupervisor,
            };
            const isProcessing = processingId === manager.id;
            // Суперадмин может редактировать себя
            const canEditSelf = isSuperAdmin === true;
            const isDisabled = isProcessing || (isSelf && !canEditSelf);
            
            return (
              <tr key={manager.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium">{manager.name}</td>
                <td className="px-6 py-4">{manager.email}</td>
                <td className="px-6 py-4">
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={state.isAdmin}
                        onChange={(e) => handleCheckboxChange(manager.id, 'isAdmin', e.target.checked)}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        disabled={isDisabled}
                      />
                      <span className="text-sm text-gray-700">Админ</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={state.isManager}
                        onChange={(e) => handleCheckboxChange(manager.id, 'isManager', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        disabled={isDisabled}
                      />
                      <span className="text-sm text-gray-700">Модератор</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={state.isSupervisor}
                        onChange={(e) => handleCheckboxChange(manager.id, 'isSupervisor', e.target.checked)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        disabled={isDisabled}
                      />
                      <span className="text-sm text-gray-700">Супервизор</span>
                    </label>
                  </div>
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
                  {!isSelf || canEditSelf ? (
                    <button
                      onClick={() => handleSave(manager.id)}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      {isProcessing ? "Сохранение..." : "Сохранить"}
                    </button>
                  ) : (
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