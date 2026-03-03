import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Все пути публичные, кроме защищённых
    // Защищаем только /admin и /account
    if (path.startsWith('/admin')) {
      if (!token?.isAdmin && !token?.isManager) {
        const url = new URL('/auth/login', req.url);
        url.searchParams.set('callbackUrl', encodeURIComponent(path));
        return NextResponse.redirect(url);
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
  matcher: ['/admin/:path*', '/account/:path*'] // Только эти пути
};