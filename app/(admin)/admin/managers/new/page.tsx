'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewManagerPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'MANAGER',
    isActive: true,
    permissions: {
      psychologists: { view: true },
      pages: { view: true },
      listdate: { view: true },
      articles: { view: true },
      managers: { view: false },                               

    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

                
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      setIsLoading(false);
      return;
    }

    try {
                                                                               
      const formattedPermissions: Record<string, { view: boolean; edit: boolean }> = {};
      Object.keys(formData.permissions).forEach(module => {
                                                               
        if (formData.role === 'ADMIN' && module === 'managers') {
          formattedPermissions[module] = {
            view: true,
            edit: true
          };
        } else {
          formattedPermissions[module] = {
            view: (formData.permissions as any)[module].view,
            edit: (formData.permissions as any)[module].view                          
          };
        }
      });

      const response = await fetch('/api/admin/managers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          permissions: formattedPermissions
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при создании менеджера');
      }

                                                        
      router.push('/admin/managers');
      router.refresh();
    } catch (error: any) {
      setError(error.message || 'Произошла ошибка');
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
                                                                                      
        ...(name === 'role' && value === 'ADMIN' ? {
          permissions: {
            ...prev.permissions,
            managers: { view: true }
          }
        } : {})
      }));
    }
  };

  const handlePermissionChange = (module: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          view: value
        }
      }
    }));
  };

  const moduleNames = {
    psychologists: 'Психологи',
    pages: 'Страницы',
    listdate: 'Список данных',
    articles: 'Статьи',
    managers: 'Управление менеджерами',
  };

  const moduleDescriptions = {
    psychologists: 'Доступ к управлению психологами',
    pages: 'Доступ к редактированию страниц сайта',
    listdate: 'Доступ к управлению справочниками',
    articles: 'Доступ к управлению статьями',
    managers: 'Доступ к управлению пользователями системы (только для администраторов)',
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center">
          <Link
            href="/admin/managers"
            className="text-gray-500 hover:text-gray-700 mr-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-[1.75rem] sm:text-3xl font-bold text-gray-900">Добавить нового менеджера</h1>
            <p className="mt-2 text-[15px] text-gray-600">Заполните информацию о новом менеджере</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-7">
          {                         }
          <div className="bg-white shadow rounded-lg p-7">
            <h2 className="text-xl font-medium text-gray-900 mb-4">Основная информация</h2>
            
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Имя менеджера *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 text-[15px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Иван Иванов"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 text-[15px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="manager@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Пароль *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 text-[15px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Не менее 6 символов"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Подтверждение пароля *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 text-[15px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Повторите пароль"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Роль *
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 text-[15px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="MANAGER">Менеджер</option>
                  <option value="ADMIN">Администратор</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {formData.role === 'ADMIN' 
                    ? 'Администратор имеет полный доступ ко всем разделам' 
                    : 'Менеджер имеет ограниченный доступ'}
                </p>
              </div>

              <div className="flex items-center pt-6">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Активный аккаунт
                </label>
              </div>
            </div>
          </div>

          {                                       }
          <div className="bg-white shadow rounded-lg p-7">
            <h2 className="text-xl font-medium text-gray-900 mb-4">Права доступа</h2>
            <p className="text-sm text-gray-600 mb-4">
              {formData.role === 'ADMIN' 
                ? 'Администратор имеет полный доступ ко всем разделам системы, включая управление менеджерами.'
                : 'Менеджеру доступны только отмеченные разделы. Доступ к управлению менеджерами есть только у администраторов.'}
            </p>
            
            <div className="space-y-3">
              {Object.entries(moduleNames).map(([module, name]) => (
                <div 
                  key={module} 
                  className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 ${
                    module === 'managers' && formData.role === 'MANAGER' 
                      ? 'border-gray-200 bg-gray-50 opacity-75' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="font-medium text-gray-900">{name}</h3>
                      {module === 'managers' && formData.role === 'MANAGER' && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                          Только администратор
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {moduleDescriptions[module as keyof typeof moduleDescriptions]}
                    </p>
                  </div>
                  <label className="flex items-center cursor-pointer ml-4">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={
                                                                           
                          formData.role === 'ADMIN' 
                            ? true 
                            :                                                    
                              module === 'managers' 
                                ? false 
                                : (formData.permissions as any)[module]?.view || false
                        }
                        onChange={(e) => {
                                                                             
                          if (module === 'managers' && formData.role === 'MANAGER') {
                            return;
                          }
                          handlePermissionChange(module, e.target.checked);
                        }}
                        disabled={
                                                         
                          formData.role === 'ADMIN' ||
                                                                             
                          (module === 'managers' && formData.role === 'MANAGER')
                        }
                        className="sr-only"
                      />
                      <div className={`block w-10 h-6 rounded-full ${
                        formData.role === 'ADMIN' 
                          ? 'bg-blue-300' 
                          : module === 'managers' && formData.role === 'MANAGER'
                            ? 'bg-gray-200'
                            : (formData.permissions as any)[module]?.view 
                              ? 'bg-blue-600' 
                              : 'bg-gray-300'
                      }`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${
                        formData.role === 'ADMIN' 
                          ? 'transform translate-x-4' 
                          : module === 'managers' && formData.role === 'MANAGER'
                            ? ''
                            : (formData.permissions as any)[module]?.view 
                              ? 'transform translate-x-4' 
                              : ''
                      }`}></div>
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      {formData.role === 'ADMIN' 
                        ? 'Всегда' 
                        : module === 'managers' && formData.role === 'MANAGER'
                          ? 'Нет доступа'
                          : (formData.permissions as any)[module]?.view 
                            ? 'Вкл' 
                            : 'Выкл'}
                    </span>
                  </label>
                </div>
              ))}
            </div>

            {                }
            <div className="mt-4 space-y-2">
              {formData.role === 'ADMIN' ? (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-blue-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-blue-700">
                      Администратор автоматически получает полный доступ ко всем разделам системы, включая управление менеджерами.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-yellow-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-yellow-700">
                      Менеджер не может иметь доступ к разделу "Управление менеджерами". Эта возможность доступна только администраторам.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {                     }
          <div className="flex justify-end space-x-4 pt-6">
            <Link
              href="/admin/managers"
              className="px-5 py-2.5 border border-gray-300 rounded-md text-[15px] font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Отмена
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-blue-600 border border-transparent rounded-md text-[15px] font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Создание...
                </>
              ) : (
                'Создать менеджера'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
