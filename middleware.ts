import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Админка - только для ADMIN и MANAGER
    if (path.startsWith('/admin')) {
      if (!token) {
        // Не авторизован - шлем на логин с callbackUrl=/admin
        const url = new URL('/auth/login', req.url);
        url.searchParams.set('callbackUrl', '/admin');
        return NextResponse.redirect(url);
      }
      
      // Авторизован, но нет прав - на главную
      if (token.role !== 'ADMIN' && token.role !== 'MANAGER') {
        return NextResponse.redirect(new URL('/', req.url));
      }
      
      return NextResponse.next();
    }

    // Личный кабинет - только для USER
    if (path.startsWith('/account')) {
      if (!token) {
        // Не авторизован - шлем на логин с callbackUrl=/account
        const url = new URL('/auth/login', req.url);
        url.searchParams.set('callbackUrl', '/account');
        return NextResponse.redirect(url);
      }
      
      // Авторизован, но не USER - на главную
      if (token.role !== 'USER') {
        return NextResponse.redirect(new URL('/', req.url));
      }
      
      return NextResponse.next();
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