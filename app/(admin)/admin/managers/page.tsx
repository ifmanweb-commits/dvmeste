'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Manager {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER';
  isActive: boolean;
  permissions: Record<string, boolean>;
  createdAt: string;
  lastLogin?: string;
}

type SortField = 'name' | 'email' | 'role' | 'status' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export default function ManagersPage() {
  const router = useRouter();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [filteredManagers, setFilteredManagers] = useState<Manager[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'ADMIN' | 'MANAGER'>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

                        
  const loadManagers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetch('/api/admin/managers');
      
      if (!response.ok) {
        throw new Error('Не удалось загрузить список менеджеров');
      }
      
      const data = await response.json();
      setManagers(data);
      setFilteredManagers(data);
    } catch (error) {
      console.error('Error fetching managers:', error);
      setError('Ошибка загрузки данных. Попробуйте обновить страницу.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadManagers();
  }, [loadManagers]);

                            
  useEffect(() => {
    let result = [...managers];

            
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(manager =>
        manager.name.toLowerCase().includes(term) ||
        manager.email.toLowerCase().includes(term)
      );
    }

                        
    if (statusFilter !== 'all') {
      result = result.filter(manager => 
        statusFilter === 'active' ? manager.isActive : !manager.isActive
      );
    }

                     
    if (roleFilter !== 'all') {
      result = result.filter(manager => manager.role === roleFilter);
    }

                 
    result.sort((a, b) => {
      if (sortField === 'status') {
        const aValue = a.isActive;
        const bValue = b.isActive;
        return sortDirection === 'asc' 
          ? (aValue === bValue ? 0 : aValue ? -1 : 1)
          : (aValue === bValue ? 0 : aValue ? 1 : -1);
      }

      if (sortField === 'createdAt') {
        const aValue = new Date(a.createdAt).getTime();
        const bValue = new Date(b.createdAt).getTime();
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      if (sortField === 'name' || sortField === 'email' || sortField === 'role') {
        const aValue = a[sortField].toLowerCase();
        const bValue = b[sortField].toLowerCase();
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });

    setFilteredManagers(result);
  }, [managers, searchTerm, statusFilter, roleFilter, sortField, sortDirection]);

                                
  const handleToggleStatus = async (id: string, currentStatus: boolean, name: string) => {
    if (!confirm(`Вы уверены, что хотите ${currentStatus ? 'деактивировать' : 'активировать'} менеджера ${name}?`)) {
      return;
    }

    setIsProcessing(id);
    
    try {
      const response = await fetch(`/api/admin/managers/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
                                        
        setManagers(prev => prev.map(manager => 
          manager.id === id 
            ? { ...manager, isActive: !currentStatus } 
            : manager
        ));
        
                                   
        alert(`Менеджер ${name} успешно ${!currentStatus ? 'активирован' : 'деактивирован'}`);
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка при обновлении статуса');
        throw new Error(data.error || 'Ошибка обновления статуса');
      }
    } catch (error) {
      console.error('Error updating manager status:', error);
      alert('Произошла ошибка при обновлении статуса менеджера');
    } finally {
      setIsProcessing(null);
    }
  };

                          
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

                                       
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return (
      <span className="ml-1">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

               
  const stats = {
    total: managers.length,
    active: managers.filter(m => m.isActive).length,
    admins: managers.filter(m => m.role === 'ADMIN').length,
    managers: managers.filter(m => m.role === 'MANAGER').length,
  };

                    
  if (isLoading && managers.length === 0) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        <p className="mt-4 text-gray-600">Загрузка менеджеров...</p>
      </div>
    );
  }

  return (
    <div className="space-y-7 pr-2 sm:pr-3 lg:pr-5">
      {                        }
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[2rem] font-bold text-gray-900">Менеджеры</h1>
          <p className="mt-1 sm:mt-2 text-[15px] text-gray-600">
            Управление учетными записями менеджеров системы
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/admin/managers/new"
            className="inline-flex items-center justify-center px-5 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Добавить менеджера
          </Link>
        </div>
      </div>

      {                }
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Всего менеджеров</div>
          <div className="mt-1 text-[1.7rem] font-semibold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Активных</div>
          <div className="mt-1 text-[1.7rem] font-semibold text-green-600">{stats.active}</div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Администраторов</div>
          <div className="mt-1 text-[1.7rem] font-semibold text-purple-600">{stats.admins}</div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Менеджеров</div>
          <div className="mt-1 text-[1.7rem] font-semibold text-blue-600">{stats.managers}</div>
        </div>
      </div>

      {                     }
      <div className="bg-white p-5 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Поиск по имени или email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 text-[15px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-3 text-[15px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Все статусы</option>
              <option value="active">Активные</option>
              <option value="inactive">Неактивные</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-3 py-3 text-[15px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Все роли</option>
              <option value="ADMIN">Администраторы</option>
              <option value="MANAGER">Менеджеры</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setRoleFilter('all');
              }}
              className="px-4 py-3 text-[15px] text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              Сбросить
            </button>
          </div>
        </div>
      </div>

      {            }
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {                               }
      {filteredManagers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Менеджеры не найдены</h3>
          <p className="mt-2 text-gray-500">
            {searchTerm || statusFilter !== 'all' || roleFilter !== 'all'
              ? 'Попробуйте изменить параметры поиска'
              : 'Добавьте первого менеджера в систему'}
          </p>
          <div className="mt-6">
            <Link
              href="/admin/managers/new"
              className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
            >
              Добавить менеджера
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          {                   }
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    onClick={() => handleSort('name')}
                    className="px-6 py-3.5 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      Имя {renderSortIcon('name')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('email')}
                    className="px-6 py-3.5 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      Email {renderSortIcon('email')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('role')}
                    className="px-6 py-3.5 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      Роль {renderSortIcon('role')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('status')}
                    className="px-6 py-3.5 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      Статус {renderSortIcon('status')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('createdAt')}
                    className="px-6 py-3.5 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      Дата создания {renderSortIcon('createdAt')}
                    </div>
                  </th>
                  <th className="px-6 py-3.5 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredManagers.map((manager) => (
                  <tr key={manager.id} className="hover:bg-gray-50">
                    <td className="px-6 py-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-11 w-11 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-800 font-medium">
                            {manager.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-[15px] font-medium text-gray-900">{manager.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-[15px] text-gray-900">{manager.email}</div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        manager.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {manager.role === 'ADMIN' ? 'Администратор' : 'Менеджер'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        manager.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {manager.isActive ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-900">
                      {new Date(manager.createdAt).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex space-x-3">
                        <Link
                          href={`/admin/managers/${manager.id}/edit`}
                          className="text-blue-600 hover:text-blue-900 font-medium text-sm"
                        >
                          Редактировать
                        </Link>
                        <button
                          onClick={() => handleToggleStatus(manager.id, manager.isActive, manager.name)}
                          disabled={isProcessing === manager.id}
                          className={`font-medium text-sm ${
                            manager.isActive
                              ? 'text-red-600 hover:text-red-900'
                              : 'text-green-600 hover:text-green-900'
                          } ${isProcessing === manager.id ? 'opacity-50 cursor-not-allowed' : ''}`}
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
          <div className="md:hidden divide-y divide-gray-200">
            {filteredManagers.map((manager) => (
              <div key={manager.id} className="p-5 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-800 font-medium">
                        {manager.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{manager.name}</div>
                      <div className="text-sm text-gray-500">{manager.email}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      manager.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {manager.role === 'ADMIN' ? 'Админ' : 'Менеджер'}
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      manager.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {manager.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-gray-500">
                  Создан: {new Date(manager.createdAt).toLocaleDateString('ru-RU')}
                </div>
                
                <div className="mt-4 flex space-x-4">
                  <Link
                    href={`/admin/managers/${manager.id}/edit`}
                    className="flex-1 text-center px-3 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                  >
                    Редактировать
                  </Link>
                  <button
                    onClick={() => handleToggleStatus(manager.id, manager.isActive, manager.name)}
                    disabled={isProcessing === manager.id}
                    className={`flex-1 text-center px-3 py-2 text-sm font-medium rounded-lg ${
                      manager.isActive
                        ? 'text-red-600 border border-red-600 hover:bg-red-50'
                        : 'text-green-600 border border-green-600 hover:bg-green-50'
                    } ${isProcessing === manager.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isProcessing === manager.id ? 'Обработка...' : manager.isActive ? 'Деактив.' : 'Актив.'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {                }
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Информация о менеджерах</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Администраторы имеют полный доступ ко всем разделам системы</li>
                <li>Менеджеры видят только разрешенные разделы</li>
                <li>Деактивированные пользователи не могут войти в систему</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
