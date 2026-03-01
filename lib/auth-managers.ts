import { cookies } from 'next/headers';
import { prisma } from './db';
import bcrypt from 'bcryptjs';

export const MANAGER_COOKIE_NAME = "manager_session";
export const ADMIN_COOKIE_NAME = "admin_session";

export function getManagerSessionSecret(): string {
  return process.env.MANAGER_SESSION_SECRET || "dev_manager_session_change_me";
}

export async function checkManagerCredentials(login: string, password: string): Promise<boolean> {
  try {
    if (!prisma) return false;

    const manager = await prisma.manager.findUnique({
      where: { email: login },
    });

    if (!manager || !manager.isActive) return false;
    return bcrypt.compare(password, manager.password);
  } catch (error) {
    console.error("Ошибка проверки менеджера:", error);
    return false;
  }
}

export async function getManagerByLogin(login: string) {
  try {
    if (!prisma) return null;

    return await prisma.manager.findUnique({
      where: { email: login },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true,
      },
    });
  } catch (error) {
    console.error("Ошибка получения менеджера:", error);
    return null;
  }
}

export function isManagerSessionValid(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;

  try {
    const decoded = Buffer.from(cookieValue, 'base64').toString();
    const [managerId, timestamp] = decoded.split(':');

    if (!managerId || !timestamp) return false;

    const tokenTime = Number.parseInt(timestamp, 10);
    const maxAge = 24 * 60 * 60 * 1000;

    return Number.isFinite(tokenTime) && Date.now() - tokenTime < maxAge;
  } catch {
    return false;
  }
}

export function createManagerSessionToken(managerId: string): string {
  return Buffer.from(`${managerId}:${Date.now()}`).toString('base64');
}

export async function managerLogout() {
  'use server';

  try {
    const cookieStore = await cookies();
    await cookieStore.delete(MANAGER_COOKIE_NAME);
  } catch (error) {
    console.error('Ошибка при выходе:', error);
  }
}

export async function getCurrentManager() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = await cookieStore.get(MANAGER_COOKIE_NAME);

    if (!sessionCookie?.value || !isManagerSessionValid(sessionCookie.value)) {
      return null;
    }

    const decoded = Buffer.from(sessionCookie.value, 'base64').toString();
    const [managerId] = decoded.split(':');

    if (!managerId) return null;

    return await getManagerById(managerId);
  } catch (error) {
    console.error('Ошибка получения текущего менеджера:', error);
    return null;
  }
}

export async function getManagerById(id: string) {
  try {
    if (!prisma) return null;

    return await prisma.manager.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true,
      },
    });
  } catch (error) {
    console.error("Ошибка получения менеджера по ID:", error);
    return null;
  }
}

export async function requireManager() {
  return getCurrentManager();
}

export function hasPermission(
  manager: { permissions?: unknown } | null | undefined,
  section: string,
  action: 'view' | 'edit' | 'delete' = 'view'
): boolean {
  if (!manager?.permissions) return false;

  try {
    const permissions = typeof manager.permissions === 'string'
      ? JSON.parse(manager.permissions)
      : manager.permissions;

    if (!permissions || typeof permissions !== 'object') return false;
    const sectionPerms = (permissions as Record<string, Record<string, boolean>>)[section];
    return sectionPerms?.[action] === true;
  } catch (error) {
    console.error('Ошибка проверки разрешений:', error);
    return false;
  }
}

export function hasRole(manager: { role?: string } | null | undefined, role: string): boolean {
  return manager?.role === role;
}

export async function getManagerIdFromSession(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = await cookieStore.get(MANAGER_COOKIE_NAME);

    if (!sessionCookie?.value) return null;

    const decoded = Buffer.from(sessionCookie.value, 'base64').toString();
    const [managerId] = decoded.split(':');

    return managerId || null;
  } catch {
    return null;
  }
}

export function getManagerIdFromCookie(cookieStore: { get: (name: string) => { value?: string } | undefined }): string | null {
  try {
    const sessionCookie = cookieStore.get(MANAGER_COOKIE_NAME);
    if (!sessionCookie?.value) return null;

    const decoded = Buffer.from(sessionCookie.value, 'base64').toString();
    const [managerId] = decoded.split(':');

    return managerId || null;
  } catch {
    return null;
  }
}
