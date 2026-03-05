'use server';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/require';
import { revalidatePath } from 'next/cache';

interface BlockUpdateData {
  id: string;
  content: string;
  isActive: boolean;
}

export async function getBlocks() {
  await requireAdmin();

  try {
    const blocks = await prisma.blocks.findMany({
      orderBy: {
        slug: 'asc',
      },
    });
    return blocks;
  } catch (error) {
    console.error('Error fetching blocks:', error);
    return [];
  }
}

export async function updateBlocks(blocksData: BlockUpdateData[]) {
  await requireAdmin();

  try {
    // Обновляем каждый блок
    for (const block of blocksData) {
      await prisma.blocks.update({
        where: { id: block.id },
        data: {
          content: block.content,
          isActive: block.isActive,
        },
      });
    }

    // Инвалидируем кеш, чтобы изменения применились на сайте
    revalidatePath('/', 'layout');
    
    return { success: true };
  } catch (error) {
    console.error('Error updating blocks:', error);
    throw new Error('Не удалось сохранить блоки');
  }
}

export async function getBlockBySlug(slug: string) {
  // Эта функция будет использоваться в layout'ах
  try {
    const block = await prisma.blocks.findUnique({
      where: { slug },
    });
    return block;
  } catch (error) {
    console.error(`Error fetching block ${slug}:`, error);
    return null;
  }
}