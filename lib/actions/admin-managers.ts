"use server";

import { prisma } from "@/lib/prisma";
import { isDbSyncError } from "@/lib/db-error";

export async function getManagersList() {
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
        psychologist: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return users.map(u => ({
      id: u.id,
      name: u.fullName || 'Без имени',
      email: u.email,
      role: u.isAdmin ? 'ADMIN' : 'MANAGER', // для совместимости с таблицей
      isActive: u.emailVerified !== null,
      inCatalog: !!u.psychologist
    }));
  } catch (err) {
    if (isDbSyncError(err)) return [];
    throw err;
  }
}

export async function findUserByEmail(email: string) {
  if (!prisma) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        isAdmin: true,
        isManager: true,
        isPsychologist: true,
        emailVerified: true,
        psychologist: {
          select: {
            id: true
          }
        }
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
      role, // для совместимости с компонентом
      isActive: user.emailVerified !== null,
      inCatalog: !!user.psychologist,
      // Добавляем флаги, если понадобятся
      isAdmin: user.isAdmin,
      isManager: user.isManager,
      isPsychologist: user.isPsychologist
    };
  } catch (err) {
    console.error("Error finding user:", err);
    return null;
  }
}

export async function assignRole(userId: string, role: 'ADMIN' | 'MANAGER') {
  if (!prisma) throw new Error("Database unavailable");

  try {
    // Проверяем, подтверждён ли email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true }
    });

    if (!user?.emailVerified) {
      throw new Error("Email не подтверждён");
    }

    // Обновляем соответствующие флаги
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

    // Снимаем все админские флаги, но оставляем isPsychologist если был
    await prisma.user.update({
      where: { id: userId },
      data: {
        isAdmin: false,
        isManager: false,
        // isPsychologist не трогаем
      }
    });

    return { success: true };
  } catch (err) {
    console.error("Error removing role:", err);
    throw err;
  }
}