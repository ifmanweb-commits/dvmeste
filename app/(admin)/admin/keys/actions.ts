'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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
  const code = formData.get('code') as string;
  const maxUses = parseInt(formData.get('maxUses') as string, 10);
  const expiresAt = formData.get('expiresAt') as string;
  const isActive = formData.get('isActive') === 'on';
  const actionsJson = formData.get('actionsJson') as string;
  const id = formData.get('id') as string;

  return updateKey(id, formData);
}

export async function deleteKey(id: string) {
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