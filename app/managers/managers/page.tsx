'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import AuthGuard from '@/components/AuthGuard'

interface Manager {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  permissions: any;
  createdAt: string;
}

export default function ManagersPage() {
  const router = useRouter();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadManagers() {
      try {
        const response = await fetch('/api/managers/managers');
        if (!response.ok) {
          throw new Error('Failed to fetch managers');
        }
        const data = await response.json();
        setManagers(data);
      } catch (error) {
        console.error('Error fetching managers:', error);
        setError('Ошибка загрузки менеджеров');
      } finally {
        setIsLoading(false);
      }
    }

    loadManagers();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: boolean, name: string) => {
    if (!confirm(`Вы уверены, что хотите ${currentStatus ? 'деактивировать' : 'активировать'} менеджера ${name}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/managers/managers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        setManagers(managers.map(manager => 
          manager.id === id 
            ? { ...manager, isActive: !currentStatus } 
            : manager
        ));
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка обновления статуса');
      }
    } catch (error) {
      alert('Ошибка при обновлении статуса менеджера');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4CAF50] mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка менеджеров...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="mx-auto max-w-7xl">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800">Ошибка</h3>
                <p className="mt-2 text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard requiredPermission='managers.view'>
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        {            }
        <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Менеджеры</h1>
            <p className="mt-1 md:mt-2 text-sm text-gray-600">
              Управление менеджерами системы. Всего менеджеров: {managers.length}
            </p>
          </div>
          <Link
            href="/managers/managers/new"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-[#4CAF50] text-white font-medium rounded-lg hover:bg-[#43A047] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4CAF50] w-full sm:w-auto"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Добавить менеджера
          </Link>
        </div>

        {                  }
        <div className="bg-white shadow overflow-hidden rounded-lg">
          {managers.length === 0 ? (
            <div className="text-center py-8 md:py-12 px-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-3 text-sm font-medium text-gray-900">Нет менеджеров</h3>
              <p className="mt-1 text-sm text-gray-500">Начните с добавления нового менеджера.</p>
              <div className="mt-4">
                <Link
                  href="/managers/managers/new"
                  className="inline-flex items-center px-4 py-2 bg-[#4CAF50] text-white text-sm font-medium rounded-md hover:bg-[#43A047]"
                >
                  Добавить менеджера
                </Link>
              </div>
            </div>
          ) : (
            <>
              {                   }
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Имя
                      </th>
                      <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Роль
                      </th>
                      <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Статус
                      </th>
                      <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Дата создания
                      </th>
                      <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {managers.map((manager) => (
                      <tr key={manager.id} className="hover:bg-gray-50">
                        <td className="px-4 md:px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 md:h-10 md:w-10 bg-[#4CAF50]/10 rounded-full flex items-center justify-center">
                              <span className="text-[#4CAF50] font-medium text-sm md:text-base">
                                {manager.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-3 md:ml-4">
                              <div className="text-sm font-medium text-gray-900">{manager.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <div className="text-sm text-gray-900">{manager.email}</div>
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            manager.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-[#4CAF50]/10 text-[#4CAF50]'
                          }`}>
                            {manager.role === 'ADMIN' ? 'Администратор' : 'Менеджер'}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            manager.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {manager.isActive ? 'Активен' : 'Неактивен'}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-sm text-gray-500">
                          {new Date(manager.createdAt).toLocaleDateString('ru-RU')}
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <Link
                              href={`/managers/managers/${manager.id}/edit`}
                              className="text-[#4CAF50] hover:text-[#43A047] text-sm font-medium"
                            >
                              Редактировать
                            </Link>
                            <button
                              onClick={() => handleToggleStatus(manager.id, manager.isActive, manager.name)}
                              className="text-red-600 hover:text-red-900 text-sm font-medium text-left sm:text-left"
                            >
                          
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {                  }
              <div className="md:hidden">
                {managers.map((manager) => (
                  <div key={manager.id} className="border-b border-gray-200 last:border-b-0 p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-[#4CAF50]/10 rounded-full flex items-center justify-center">
                          <span className="text-[#4CAF50] font-medium">
                            {manager.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{manager.name}</div>
                          <div className="text-sm text-gray-500 mt-1">{manager.email}</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          manager.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-[#4CAF50]/10 text-[#4CAF50]'
                        }`}>
                          {manager.role === 'ADMIN' ? 'Админ' : 'Менеджер'}
                        </span>
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          manager.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {manager.isActive ? 'Активен' : 'Неактивен'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-500">
                      Создан: {new Date(manager.createdAt).toLocaleDateString('ru-RU')}
                    </div>
                    
                    <div className="mt-4 flex gap-3">
                      <Link
                        href={`/managers/managers/${manager.id}/edit`}
                        className="flex-1 text-center px-3 py-2 bg-[#4CAF50] text-white text-sm font-medium rounded-md hover:bg-[#43A047]"
                      >
                        Редактировать
                      </Link>
                      <button
                        onClick={() => handleToggleStatus(manager.id, manager.isActive, manager.name)}
                        className={`flex-1 text-center px-3 py-2 text-sm font-medium rounded-md ${
                          manager.isActive
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {manager.isActive ? 'Деактив.' : 'Актив.'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {              }
        <div className="mt-6 md:mt-8 p-4 bg-blue-50 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Информация о менеджерах</h3>
              <div className="mt-1 md:mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Администраторы имеют полный доступ ко всем разделам системы</li>
                  <li>Менеджеры видят только те разделы, которые им разрешены</li>
                  <li>Деактивированные менеджеры не могут войти в систему</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}