"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";

export function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const isAuthPage = pathname === "/admin/login";

  // Если страница авторизации — показываем без проверок
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Пока сессия загружается — показываем заглушку
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5858E2]"></div>
      </div>
    );
  }

  // Если нет сессии — редирект на логин (хотя middleware должен был поймать)
  if (!session?.user) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Сессия не найдена</h2>
          <p className="text-gray-600 mb-6">
            Пожалуйста, войдите в систему заново.
          </p>
          <Link
            href="/auth/login"
            className="inline-block bg-[#5858E2] text-white px-6 py-2 rounded-lg hover:bg-[#4747b5] transition-colors"
          >
            Войти
          </Link>
        </div>
      </div>
    );
  }

  const isAdmin = session.user.isAdmin === true;
  const isManager = session.user.isManager === true;

  // Проверка доступа к текущему разделу
  const checkAccess = () => {
    // Разделы только для админа
    const adminOnlyRoutes = [
      '/admin/pages',
      '/admin/managers',
      '/admin/menu',
      '/admin/ListDate',
    ];

    // Разделы для админа и менеджера
    const managerRoutes = [
      '/admin/psychologists',
      '/admin/candidates',
      '/admin/articles',
    ];

    // Проверяем, является ли текущий путь админским
    const isAdminRoute = adminOnlyRoutes.some(route => 
      pathname === route || pathname.startsWith(route + '/')
    );

    // Проверяем, является ли текущий путь менеджерским
    const isManagerRoute = managerRoutes.some(route => 
      pathname === route || pathname.startsWith(route + '/')
    );

    if (isAdminRoute && !isAdmin) {
      return false;
    }

    if (isManagerRoute && !isAdmin && !isManager) {
      return false;
    }

    return true;
  };

  const hasAccess = checkAccess();

  // Если нет доступа — показываем сообщение
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Доступ запрещён</h2>
          <p className="text-gray-600 mb-6">
            У вас недостаточно прав для просмотра этого раздела.
          </p>
          <Link
            href="/admin"
            className="inline-block bg-[#5858E2] text-white px-6 py-2 rounded-lg hover:bg-[#4747b5] transition-colors"
          >
            Вернуться в админку
          </Link>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut({ 
      redirect: true,
      callbackUrl: "/auth/login"
    });
  };

  // Навигация (будет видна только если есть доступ)
  const nav = (
    <nav className="rounded-xl border-2 border-[#5858E2]/20 bg-white p-4 shadow-md lg:border lg:p-5">
      <ul className="space-y-1.5">
        <li>
          <Link href="/admin" onClick={() => setSidebarOpen(false)} className="block rounded-lg px-3.5 py-2.5 text-[15px] font-medium text-foreground hover:bg-[#5858E2]/10 hover:text-[#5858E2]">
            Главная
          </Link>
        </li>
        
        {/* Психологи и кандидаты — для всех */}
        <li>
          <Link href="/admin/psychologists" onClick={() => setSidebarOpen(false)} className="block rounded-lg px-3.5 py-2.5 text-[15px] font-medium text-foreground hover:bg-[#5858E2]/10 hover:text-[#5858E2]">
            Психологи
          </Link>
        </li>
        <li>
          <Link href="/admin/candidates" onClick={() => setSidebarOpen(false)} className="block rounded-lg px-3.5 py-2.5 text-[15px] font-medium text-foreground hover:bg-[#5858E2]/10 hover:text-[#5858E2]">
            Кандидаты
          </Link>
        </li>
        <li>
          <Link href="/admin/articles" onClick={() => setSidebarOpen(false)} className="block rounded-lg px-3.5 py-2.5 text-[15px] font-medium text-foreground hover:bg-[#5858E2]/10 hover:text-[#5858E2]">
            Статьи
          </Link>
        </li>

        {/* Админские разделы — только для админов */}
        {isAdmin && (
          <>
            <li>
              <Link href="/admin/pages" onClick={() => setSidebarOpen(false)} className="block rounded-lg px-3.5 py-2.5 text-[15px] font-medium text-foreground hover:bg-[#5858E2]/10 hover:text-[#5858E2]">
                Страницы сайта
              </Link>
            </li>
            <li>
              <Link href="/admin/managers" onClick={() => setSidebarOpen(false)} className="block rounded-lg px-3.5 py-2.5 text-[15px] font-medium text-foreground hover:bg-[#5858E2]/10 hover:text-[#5858E2]">
                Менеджеры
              </Link>
            </li>
            <li>
              <Link href="/admin/menu" onClick={() => setSidebarOpen(false)} className="block rounded-lg px-3.5 py-2.5 text-[15px] font-medium text-foreground hover:bg-[#5858E2]/10 hover:text-[#5858E2]">
                Меню
              </Link>
            </li>
            <li>
              <Link href="/admin/ListDate" onClick={() => setSidebarOpen(false)} className="block rounded-lg px-3.5 py-2.5 text-[15px] font-medium text-foreground hover:bg-[#5858E2]/10 hover:text-[#5858E2]">
                Списки данных
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <header className="sticky top-0 z-30 border-b-2 border-[#5858E2]/30 bg-white px-3 py-3 shadow-sm sm:px-4 sm:py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen((o) => !o)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-[#F5F5F7] text-foreground hover:bg-[#5858E2]/10 lg:hidden"
              aria-label="Меню"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-display text-base font-bold text-[#5858E2] sm:text-lg">
              Админ-панель
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/" className="rounded-lg bg-[#A7FF5A] px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-[#8ee64a] sm:px-3 sm:text-sm">
              На сайт
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs text-neutral-dark hover:bg-neutral-100 sm:px-3 sm:text-sm"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      {/* Оверлей для мобильного меню */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <div className="mx-auto flex w-full max-w-[1900px] gap-0 px-3 py-4 sm:px-4 sm:py-8 lg:gap-8">
        {/* Сайдбар */}
        <aside
          className={`fixed left-0 top-14 z-50 h-[calc(100vh-3.5rem)] w-72 max-w-[85vw] transform border-r border-neutral-200 bg-white p-4 shadow-xl transition-transform duration-200 lg:static lg:top-0 lg:z-auto lg:block lg:h-auto lg:w-60 lg:max-w-none lg:shrink-0 lg:translate-x-0 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          {nav}
        </aside>
        
        {/* Основной контент */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}