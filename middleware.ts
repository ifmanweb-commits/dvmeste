import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Все пути публичные, кроме защищённых
    if (path.startsWith('/admin')) {
      if (!token) {
        const url = new URL('/auth/login', req.url);
        url.searchParams.set('callbackUrl', encodeURIComponent(path));
        return NextResponse.redirect(url);
      }
      
      // Если пользователь авторизован, но не админ и не менеджер
      if (!token.isAdmin && !token.isManager) {
        return NextResponse.redirect(new URL('/', req.url));
      }
      
      // Если админ - пускаем везде (без дополнительных проверок)
      if (token.isAdmin) {
        return NextResponse.next();
      }
      
      // Если менеджер - ограничиваем доступ (и при этом не админ)
      if (token.isManager && !token.isAdmin) {
        // Разрешённые пути для менеджера
        const allowedPaths = [
          '/admin',
          '/admin/psychologists',
          '/admin/psychologists/',
          '/admin/candidates',
          '/admin/candidates/',
          '/admin/articles',
          '/admin/articles/',
        ];
        
        // Проверяем, начинается ли путь с разрешённого
        const isAllowed = allowedPaths.some(allowedPath => 
          path === allowedPath || path.startsWith(allowedPath + '/')
        );
        
        if (!isAllowed) {
          return NextResponse.redirect(new URL('/admin', req.url));
        }
      }
    }

    if (path.startsWith('/account')) {
      if (!token?.isPsychologist) {
        const url = new URL('/auth/login', req.url);
        url.searchParams.set('callbackUrl', encodeURIComponent(path));
        return NextResponse.redirect(url);
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/admin/:path*', '/account/:path*']
};