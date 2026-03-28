"use server";

import { prisma } from "@/lib/prisma";
import { isDbSyncError } from "@/lib/db-error";
import { getCurrentUser } from '@/lib/auth/session';
import { createHash } from 'crypto';

export type Manager = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER";
  isActive: boolean;
  inCatalog: boolean;  // теперь проверяем статус психолога
};

export async function getManagersList(): Promise<Manager[]> {
  if (!prisma) return [];

  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { isAdmin: true },
          { isManager: true }
        ]
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        isAdmin: true,
        isManager: true,
        emailVerified: true,
        status: true,  // ← проверяем статус психолога вместо psychologist.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return users.map(u => ({
      id: u.id,
      name: u.fullName || 'Без имени',
      email: u.email,
      role: u.isAdmin ? 'ADMIN' : 'MANAGER',
      isActive: u.emailVerified !== null,
      inCatalog: u.status === 'ACTIVE',  // психолог в каталоге, если статус ACTIVE
    }));
  } catch (err) {
    if (isDbSyncError(err)) return [];
    throw err;
  }
}

export async function findUserByEmail(email: string) {
  if (!prisma) return null;

  try {
    const emailHash = createHash('sha256').update(email.toLowerCase().trim()).digest('hex')
    
    const user = await prisma.user.findUnique({
      where: { emailHash },
      select: {
        id: true,
        email: true,
        fullName: true,
        isAdmin: true,
        isManager: true,
        // isPsychologist убрали, его нет в модели
        emailVerified: true,
        status: true,  // ← вместо psychologist
      }
    });

    if (!user) return null;

    // Определяем роль для отображения
    let role: 'ADMIN' | 'MANAGER' | 'USER' = 'USER';
    if (user.isAdmin) role = 'ADMIN';
    else if (user.isManager) role = 'MANAGER';

    return {
      id: user.id,
      name: user.fullName || 'Без имени',
      email: user.email,
      role,
      isActive: user.emailVerified !== null,
      inCatalog: user.status === 'ACTIVE',  // ← по статусу
      isAdmin: user.isAdmin,
      isManager: user.isManager,
      // isPsychologist: user.isPsychologist убрали
    };
  } catch (err) {
    console.error("Error finding user:", err);
    return null;
  }
}

// assignRole и removeRole остаются без изменений
export async function assignRole(userId: string, role: 'ADMIN' | 'MANAGER') {
  if (!prisma) throw new Error("Database unavailable");

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true }
    });

    if (!user?.emailVerified) {
      throw new Error("Email не подтверждён");
    }

    const updateData = role === 'ADMIN' 
      ? { isAdmin: true, isManager: false }
      : { isManager: true, isAdmin: false };

    await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    return { success: true };
  } catch (err) {
    console.error("Error assigning role:", err);
    throw err;
  }
}

export async function removeRole(userId: string) {
  if (!prisma) throw new Error("Database unavailable");

  try {
    // Получаем текущего пользователя
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      throw new Error("Не авторизован");
    }

    // Запрещаем снимать права с самого себя
    if (currentUser.id === userId) {
      throw new Error("Нельзя снять права с самого себя");
    }

    // Проверяем, не последний ли это админ
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true }
    });

    if (user?.isAdmin) {
      const adminCount = await prisma.user.count({
        where: { isAdmin: true }
      });

      if (adminCount <= 1) {
        throw new Error("Нельзя удалить последнего администратора");
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        isAdmin: false,
        isManager: false,
      }
    });

    return { success: true };
  } catch (err) {
    console.error("Error removing role:", err);
    throw err;
  }
}