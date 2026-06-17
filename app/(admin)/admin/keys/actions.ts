'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/require';
import { checkRateLimit, incrementAttempt } from '@/lib/auth/rate-limiter';

export interface KeyAction {
  type:
    | 'grant_page_access'
    | 'revoke_page_access'
    | 'enroll_course'
    | 'unenroll_course'
    | 'complete_challenge'
    | 'add_balance'
    | 'subtract_balance'
    | 'add_attempts'
    | 'give_award'
    | 'revoke_award';
  pageId?: string;
  courseId?: string;
  challengeId?: string;
  status?: 'enrolled' | 'graduated';
  quantity?: number;
  amount?: number;
  awardId?: string;
}

export interface KeyActionsData {
  actions: KeyAction[];
}

export async function createKey(formData: FormData) {
  const admin = await requireAdmin();
  
  // Rate limiting для административных действий
  const rateLimit = await checkRateLimit('admin-action', admin.id);
  if (rateLimit.isLimited) {
    throw new Error('Превышен лимит административных действий');
  }

  const code = formData.get('code') as string;
  const maxUses = parseInt(formData.get('maxUses') as string, 10);
  const expiresAt = formData.get('expiresAt') as string;
  const isActive = formData.get('isActive') === 'on';
  const actionsJson = formData.get('actionsJson') as string;

  // Проверка уникальности кода
  const existing = await prisma.key.findUnique({ where: { code } });
  if (existing) {
    throw new Error('Ключ с таким кодом уже существует');
  }

  // Парсинг действий
  let actions: KeyActionsData;
  try {
    actions = JSON.parse(actionsJson);
  } catch {
    throw new Error('Неверный формат действий');
  }

  // Валидация: хотя бы одно действие
  if (!actions.actions || actions.actions.length === 0) {
    throw new Error('Ключ должен содержать хотя бы одно действие');
  }

  // Увеличиваем счётчик попыток
  await incrementAttempt('admin-action', admin.id);

  await prisma.key.create({
    data: {
      code,
      maxUses,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive,
      actionsJson: actions,
    },
  });

  revalidatePath('/admin/keys');
  redirect('/admin/keys');
}

export async function updateKey(id: string, formData: FormData) {
  const admin = await requireAdmin();
  
  // Rate limiting для административных действий
  const rateLimit = await checkRateLimit('admin-action', admin.id);
  if (rateLimit.isLimited) {
    throw new Error('Превышен лимит административных действий');
  }
  
  // Увеличиваем счётчик попыток
  await incrementAttempt('admin-action', admin.id);

  const code = formData.get('code') as string;
  const maxUses = parseInt(formData.get('maxUses') as string, 10);
  const expiresAt = formData.get('expiresAt') as string;
  const isActive = formData.get('isActive') === 'on';
  const actionsJson = formData.get('actionsJson') as string;

  const existingKey = await prisma.key.findUnique({ where: { id } });
  if (!existingKey) {
    throw new Error('Ключ не найден');
  }

  // Проверка уникальности кода (если код изменился)
  if (code !== existingKey.code) {
    const codeExists = await prisma.key.findUnique({ where: { code } });
    if (codeExists) {
      throw new Error('Ключ с таким кодом уже существует');
    }
  }

  // Парсинг действий
  let actions: KeyActionsData;
  try {
    actions = JSON.parse(actionsJson);
  } catch {
    throw new Error('Неверный формат действий');
  }

  // Валидация: хотя бы одно действие
  if (!actions.actions || actions.actions.length === 0) {
    throw new Error('Ключ должен содержать хотя бы одно действие');
  }

  await prisma.key.update({
    where: { id },
    data: {
      code,
      maxUses,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive,
      actionsJson: actions,
    },
  });

  revalidatePath('/admin/keys');
  redirect('/admin/keys');
}

export async function updateKeyAction(formData: FormData) {
  const admin = await requireAdmin();
  
  // Rate limiting для административных действий
  const rateLimit = await checkRateLimit('admin-action', admin.id);
  if (rateLimit.isLimited) {
    throw new Error('Превышен лимит административных действий');
  }
  
  await incrementAttempt('admin-action', admin.id);

  const code = formData.get('code') as string;
  const maxUses = parseInt(formData.get('maxUses') as string, 10);
  const expiresAt = formData.get('expiresAt') as string;
  const isActive = formData.get('isActive') === 'on';
  const actionsJson = formData.get('actionsJson') as string;
  const id = formData.get('id') as string;

  return updateKey(id, formData);
}

export async function deleteKey(id: string) {
  const admin = await requireAdmin();
  
  // Rate limiting для административных действий
  const rateLimit = await checkRateLimit('admin-action', admin.id);
  if (rateLimit.isLimited) {
    throw new Error('Превышен лимит административных действий');
  }
  
  await incrementAttempt('admin-action', admin.id);

  const key = await prisma.key.findUnique({ where: { id } });
  if (!key) {
    return { error: 'Ключ не найден' };
  }

  // Удаляем все записи KeyUse (каскад)
  await prisma.keyUse.deleteMany({
    where: { keyId: id },
  });

  // Удаляем ключ
  await prisma.key.delete({ where: { id } });

  revalidatePath('/admin/keys');
}

export async function deleteExpiredKeys() {
  const admin = await requireAdmin();
  
  // Rate limiting для административных действий
  const rateLimit = await checkRateLimit('admin-action', admin.id);
  if (rateLimit.isLimited) {
    throw new Error('Превышен лимит административных действий');
  }
  
  await incrementAttempt('admin-action', admin.id);

  const now = new Date();

  // Находим ключи с истёкшим сроком
  const expiredByDate = await prisma.key.findMany({
    where: {
      expiresAt: {
        lt: now,
      },
    },
    select: { id: true },
  });

  // Находим ключи с исчерпанным лимитом
  const exhaustedByUses = await prisma.key.findMany({
    where: {
      maxUses: { gt: 0 },
    },
    select: { id: true, maxUses: true, usedCount: true },
  });

  const exhaustedIds = exhaustedByUses
    .filter((k) => k.usedCount >= k.maxUses)
    .map((k) => k.id);

  // Объединяем и убираем дубликаты
  const allIds = [...new Set([...expiredByDate.map((k) => k.id), ...exhaustedIds])];

  if (allIds.length === 0) {
    return { deleted: 0, message: 'Нет неактуальных ключей' };
  }

  // Удаляем все неактуальные ключи
  await prisma.key.deleteMany({
    where: {
      id: {
        in: allIds,
      },
    },
  });

  revalidatePath('/admin/keys');

  return { deleted: allIds.length, message: `Удалено ключей: ${allIds.length}` };
}

export async function getKeyById(id: string) {
  return prisma.key.findUnique({ where: { id } });
}

export async function getAllSecretPages() {
  return prisma.secretPage.findMany({
    select: { id: true, title: true, slug: true },
    orderBy: { title: 'asc' },
  });
}

export async function getAllCourses() {
  return prisma.course.findMany({
    select: { id: true, title: true, slug: true },
    orderBy: { title: 'asc' },
  });
}

export async function getAllChallenges() {
  return prisma.challenge.findMany({
    select: { id: true, title: true, slug: true, type: true },
    where: { isActive: true },
    orderBy: { title: 'asc' },
  });
}