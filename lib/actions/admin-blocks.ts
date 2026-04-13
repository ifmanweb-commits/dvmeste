'use server';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/require';
import { revalidatePath, revalidateTag } from 'next/cache';
import { unstable_cache } from 'next/cache';

interface BlockUpdateData {
  id: string;
  content: string;
  isActive: boolean;
  isScript?: boolean;
  inHead?: boolean;
  order?: number;
}

export interface BlockCreateData {
  name: string;
  slug: string;
  description?: string;
  content?: string;
  isActive?: boolean;
  isScript?: boolean;
  inHead?: boolean;
  order?: number;
}

/**
 * Получает все блоки для админки
 */
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

/**
 * Получает все активные блоки для рендеринга на сайте
 * Кэшируется для производительности
 */
export async function getAllActiveBlocks() {
  return await unstable_cache(
    async () => {
      try {
        return await prisma.blocks.findMany({
          where: { isActive: true },
          orderBy: { order: 'asc' },
        });
      } catch (error) {
        console.error('Error fetching active blocks:', error);
        return [];
      }
    },
    ['blocks-active'],
    {
      tags: ['blocks'],
      revalidate: 60, // Реvalidate каждые 60 секунд
    }
  )();
}

/**
 * Сохраняет отдельный блок
 */
export async function saveBlock(blockData: BlockUpdateData) {
  await requireAdmin();

  try {
    await prisma.blocks.update({
      where: { id: blockData.id },
      data: {
        content: blockData.content,
        isActive: blockData.isActive,
        isScript: blockData.isScript,
        inHead: blockData.inHead,
        order: blockData.order,
      },
    });

    // Инвалидируем кеш
    revalidateTag('blocks', 'default');
    revalidatePath('/admin/blocks');
    
    return { success: true };
  } catch (error) {
    console.error('Error saving block:', error);
    throw new Error('Не удалось сохранить блок');
  }
}

/**
 * Обновляет существующие блоки
 */
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
          isScript: block.isScript,
          inHead: block.inHead,
          order: block.order,
        },
      });
    }

    // Инвалидируем кеш
    revalidateTag('blocks', 'default');
    revalidatePath('/admin/blocks');
    
    return { success: true };
  } catch (error) {
    console.error('Error updating blocks:', error);
    throw new Error('Не удалось сохранить блоки');
  }
}

/**
 * Создаёт новый блок
 */
export async function createBlock(data: BlockCreateData) {
  await requireAdmin();

  try {
    const block = await prisma.blocks.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || '',
        content: data.content || '',
        isActive: data.isActive ?? true,
        isScript: data.isScript ?? false,
        inHead: data.inHead ?? false,
        order: data.order ?? 0,
      },
    });

    // Инвалидируем кеш
    revalidateTag('blocks', 'default');
    revalidatePath('/admin/blocks');
    
    return { success: true, block };
  } catch (error) {
    console.error('Error creating block:', error);
    throw new Error('Не удалось создать блок');
  }
}

/**
 * Удаляет блок
 */
export async function deleteBlock(blockId: string) {
  await requireAdmin();

  try {
    await prisma.blocks.delete({
      where: { id: blockId },
    });

    // Инвалидируем кеш
    revalidateTag('blocks', 'default');
    revalidatePath('/admin/blocks');
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting block:', error);
    throw new Error('Не удалось удалить блок');
  }
}

/**
 * Получает блок по slug (для использования в layout)
 */
export async function getBlockBySlug(slug: string) {
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

/**
 * Получает блоки по slug'ам (для использования в BlockRenderer)
 */
export async function getBlocksBySlugs(slugs: string[]) {
  try {
    return await prisma.blocks.findMany({
      where: {
        slug: { in: slugs },
        isActive: true,
      },
      orderBy: { order: 'asc' },
    });
  } catch (error) {
    console.error('Error fetching blocks by slugs:', error);
    return [];
  }
}

/**
 * Получает body-блоки по slug'ам (для использования в компонентах)
 */
export async function getBodyBlocksBySlugs(slugs: string[]) {
  try {
    return await prisma.blocks.findMany({
      where: {
        slug: { in: slugs },
        isActive: true,
        inHead: false,
      },
      orderBy: { order: 'asc' },
    });
  } catch (error) {
    console.error('Error fetching body blocks by slugs:', error);
    return [];
  }
}

/**
 * Получает head-блоки по slug'ам (для использования в layout)
 */
export async function getHeadBlocksBySlugs(slugs: string[]) {
  try {
    return await prisma.blocks.findMany({
      where: {
        slug: { in: slugs },
        isActive: true,
        inHead: true,
      },
      orderBy: { order: 'asc' },
    });
  } catch (error) {
    console.error('Error fetching head blocks by slugs:', error);
    return [];
  }
}
