import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET ?? 'dev_admin_session_change_me';
const MANAGER_SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

type AuthSessionShape = {
  id?: unknown;
  role?: unknown;
  isDefaultAdmin?: unknown;
  isActive?: unknown;
  expires?: unknown;
};

function getOriginFromRequest(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = (forwardedHost || request.headers.get('host') || '').split(',')[0]?.trim();

  if (!host) {
    return request.nextUrl.origin;
  }

  const forwardedProto = request.headers.get('x-forwarded-proto');
  const proto = (forwardedProto || request.nextUrl.protocol.replace(':', '') || 'https')
    .split(',')[0]
    .trim();

  return `${proto}://${host}`;
}

function parseAuthSession(cookieValue?: string): AuthSessionShape | null {
  if (!cookieValue) return null;
  try {
    const parsed = JSON.parse(cookieValue) as AuthSessionShape;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function isAuthSessionFresh(session: AuthSessionShape | null): boolean {
  if (!session) return false;
  const expires = typeof session.expires === 'string' ? session.expires : '';
  if (!expires) return true;
  const expiresAt = new Date(expires).getTime();
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

function isManagerOrAdminRole(role: unknown): boolean {
  const normalized = String(role ?? '').toUpperCase();
  return normalized === 'MANAGER' || normalized === 'ADMIN';
}

function isManagerAuthSession(session: AuthSessionShape | null): boolean {
  if (!isAuthSessionFresh(session) || !session) return false;
  if (session.isActive === false) return false;
  return isManagerOrAdminRole(session.role);
}

function isAdminSessionValid(cookieValue?: string): boolean {
  return !!cookieValue && cookieValue === ADMIN_SESSION_SECRET;
}

function decodeBase64(value: string): string | null {
  try {
    return atob(value);
  } catch {
    return null;
  }
}

function isManagerSessionTokenValid(cookieValue?: string): boolean {
  if (!cookieValue) return false;
  const decoded = decodeBase64(cookieValue);
  if (!decoded) return false;

  const [managerId, timestampRaw] = decoded.split(':');
  if (!managerId || !timestampRaw) return false;

  const timestamp = Number.parseInt(timestampRaw, 10);
  if (!Number.isFinite(timestamp)) return false;

  return Date.now() - timestamp <= MANAGER_SESSION_MAX_AGE_MS;
}

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('auth-session');
  const adminCookie = request.cookies.get('admin_session');
  const legacyAdminCookie = request.cookies.get('admin-session');
  const managerCookie = request.cookies.get('manager_session');
  const legacyManagerCookie = request.cookies.get('manager-session');
  const pathname = request.nextUrl.pathname;
  const authSession = parseAuthSession(sessionCookie?.value);

  const adminSessionValue = adminCookie?.value || legacyAdminCookie?.value;
  const managerSessionValue = managerCookie?.value || legacyManagerCookie?.value;

  const hasAdminAccess = isAdminSessionValid(adminSessionValue);
  const hasManagersAccess =
    hasAdminAccess || isManagerAuthSession(authSession) || isManagerSessionTokenValid(managerSessionValue);

  const publicPaths = [
    '/auth/login',
    '/managers/login',
    '/admin/login',
    '/admin/forgot-password',
    '/api/auth/login',
    '/api/admin/login',
  ];

  if (publicPaths.some((publicPath) => pathname === publicPath || pathname.startsWith(`${publicPath}/`))) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!hasAdminAccess) {
      return NextResponse.redirect(new URL('/admin/login', getOriginFromRequest(request)));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/managers') || pathname.startsWith('/api/managers')) {
    if (!hasManagersAccess) {
      return NextResponse.redirect(new URL('/managers/login', getOriginFromRequest(request)));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/managers/:path*',
    '/api/admin/:path*',
    '/api/managers/:path*',
  ],
};
