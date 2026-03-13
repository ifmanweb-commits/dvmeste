"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export function AdminHeader() {
  const [manager, setManager] = useState<any>(null);

  useEffect(() => {
                                        
    const cookies = document.cookie.split('; ');
    const sessionCookie = cookies.find(row => row.startsWith('manager-session='));
    
    if (sessionCookie) {
      try {
        const sessionData = JSON.parse(sessionCookie.split('=')[1]);
        setManager(sessionData);
      } catch (error) {
        console.error("Error parsing session:", error);
      }
    }
  }, []);

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/admin" className="text-xl font-bold text-gray-900">
              Админ-панель
            </Link>
            
            {manager && (
              <div className="ml-6 flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  {manager.fullName} ({manager.email})
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-gray-700">Права:</span>
                  {manager.permissions.canManagePsychologists && (
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">Психологи</span>
                  )}
                  {manager.permissions.canManageArticles && (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">Статьи</span>
                  )}
                  {manager.permissions.canManageManagers && (
                    <span className="rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-800">Менеджеры</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <nav className="flex space-x-4">
              <Link
                href="/admin"
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Главная
              </Link>
              <Link
                href="/admin/psychologists"
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Психологи
              </Link>
              {manager?.permissions.canManageManagers && (
                <Link
                  href="/admin/managers"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Менеджеры
                </Link>
              )}
            </nav>
            
            <div className="h-6 w-px bg-gray-300"></div>
            
            <Link
              href="/admin/logout"
              className="rounded-lg px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              Выйти
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}