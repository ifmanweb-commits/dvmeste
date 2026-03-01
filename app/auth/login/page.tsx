                          
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Link from 'next/link';

export default function LoginChoicePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <div className="flex justify-center">
            <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">P</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Вход в систему
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Выберите тип пользователя для входа
          </p>
        </div>

        <div className="space-y-4">
          {                                 }
          <div className="border border-gray-300 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start">
              <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1118.879 6.196 9 9 0 015.121 17.804zM12 15v3m0 0v3m0-3h3m-3 0H9" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Главный администратор</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Полный доступ ко всем разделам системы
                </p>
                <div className="mt-4">
                  <Link
                    href="/admin/login"
                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Войти как администратор
                  </Link>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                 
                </div>
              </div>
            </div>
          </div>

          {                            }
          <div className="border border-gray-300 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start">
              <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Админы и менеджеры</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Доступ к назначенным разделам системы
                </p>
                <div className="mt-4">
                  <Link
                    href="/managers/login"
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Войти как менеджер
                  </Link>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  <p>Данные из базы данных (создаются администратором)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {                         }
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Информация</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Администратор имеет полный доступ ко всем разделам</li>
                  <li>Менеджер видит только те разделы, которые ему назначил администратор</li>
                  <li>Для смены пароля администратора отредактируйте файл .env</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}