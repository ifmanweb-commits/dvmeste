"use server";

import { prisma } from "@/lib/db";
import { isDbSyncError } from "@/lib/db-error";

export async function getManagersList() {
  if (!prisma) return [];

  try {
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ['MANAGER', 'ADMIN']
        }
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
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
      role: u.role as 'ADMIN' | 'MANAGER',
      isActive: u.emailVerified !== null,
      inCatalog: !!u.psychologist // true если есть запись в psychologists
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
        role: true,
        emailVerified: true,
        psychologist: {
          select: {
            id: true
          }
        }
      }
    });

    if (!user) return null;

    return {
      id: user.id,
      name: user.fullName || 'Без имени',
      email: user.email,
      role: user.role,
      isActive: user.emailVerified !== null,
      inCatalog: !!user.psychologist
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

    await prisma.user.update({
      where: { id: userId },
      data: { role }
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
      select: { role: true }
    });

    if (user?.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN' }
      });

      if (adminCount <= 1) {
        throw new Error("Нельзя удалить последнего администратора");
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: 'USER' }
    });

    return { success: true };
  } catch (err) {
    console.error("Error removing role:", err);
    throw err;
  }
}