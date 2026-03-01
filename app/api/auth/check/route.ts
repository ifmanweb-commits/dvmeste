import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isSessionValid } from '@/lib/auth-admin';
import { getSuperAdminPublicProfile } from '@/lib/super-admin';

function normalizeRole(role: unknown): 'ADMIN' | 'MANAGER' {
  return String(role || 'MANAGER').toUpperCase() === 'ADMIN' ? 'ADMIN' : 'MANAGER';
}

async function buildSuperAdminUser() {
  const profile = await getSuperAdminPublicProfile();
  return {
    id: profile.id,
    email: profile.email,
    name: profile.login,
    role: 'ADMIN' as const,
    permissions: {
      psychologists: { view: true, edit: true, delete: true },
      pages: { view: true, edit: true, delete: true },
      listdate: { view: true, edit: true, delete: true },
      managers: { view: true, edit: true, delete: true },
    },
    isActive: true,
    isDefaultAdmin: true,
  };
}

async function resolveManagerBySessionToken(sessionValue?: string | null) {
  if (!sessionValue) return null;

  try {
    const decoded = Buffer.from(sessionValue, 'base64').toString();
    const [managerId, timestamp] = decoded.split(':');
    if (!managerId || !timestamp) return null;

    const tokenTime = Number.parseInt(timestamp, 10);
    const maxAge = 24 * 60 * 60 * 1000;
    if (!Number.isFinite(tokenTime) || Date.now() - tokenTime > maxAge) {
      return null;
    }

    const manager = await prisma.manager.findUnique({
      where: { id: managerId },
    });

    if (!manager || !manager.isActive) return null;
    return manager;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const authSessionCookie = request.cookies.get('auth-session');
    const managerSessionCookie =
      request.cookies.get('manager_session')?.value || request.cookies.get('manager-session')?.value;
    const adminSessionCookie =
      request.cookies.get('admin_session')?.value || request.cookies.get('admin-session')?.value;

    if (authSessionCookie?.value) {
      let sessionData: Record<string, unknown>;
      try {
        sessionData = JSON.parse(authSessionCookie.value);
      } catch {
        sessionData = {};
      }

                                       
      const expires = typeof sessionData.expires === 'string' ? sessionData.expires : '';
      if (expires && new Date(expires) < new Date()) {
        sessionData = {};
      }

                                                                
      if (sessionData.isDefaultAdmin === true || sessionData.id === 'admin-default') {
        return NextResponse.json({
          user: await buildSuperAdminUser(),
        });
      }

      const managerId = typeof sessionData.id === 'string' ? sessionData.id : '';
      if (managerId) {
                                               
        const manager = await prisma.manager.findUnique({
          where: { id: managerId },
        });
        if (manager && manager.isActive) {
          return NextResponse.json({
            user: {
              id: manager.id,
              email: manager.email,
              name: manager.name,
              role: normalizeRole(manager.role),
              permissions: manager.permissions || {},
              isActive: manager.isActive,
            },
          });
        }
      }
    }

    const manager = await resolveManagerBySessionToken(managerSessionCookie);
    if (manager) {
      return NextResponse.json({
        user: {
          id: manager.id,
          email: manager.email,
          name: manager.name,
          role: normalizeRole(manager.role),
          permissions: manager.permissions || {},
          isActive: manager.isActive,
        },
      });
    }

    if (adminSessionCookie && isSessionValid(adminSessionCookie)) {
      return NextResponse.json({
        user: await buildSuperAdminUser(),
      });
    }

    return NextResponse.json({ user: null }, { status: 401 });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
