'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from "@/lib/db";

                                                              
import { PARADIGM_OPTIONS } from '@/lib/paradigm-options';

function normalizeStringList(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const item of items) {
    if (typeof item !== "string") continue;
    const value = item.trim().replace(/\s+/g, " ");
    if (!value || seen.has(value)) continue;
    seen.add(value);
    normalized.push(value);
  }

  return normalized;
}

async function getExistingArticleTags(): Promise<string[]> {
  try {
    if (!prisma) return [];
    const rows = await prisma.article.findMany({ select: { tags: true } });
    const values: string[] = [];
    const seen = new Set<string>();
    for (const row of rows) {
      for (const rawTag of row.tags ?? []) {
        if (typeof rawTag !== "string") continue;
        const tag = rawTag.trim().replace(/\s+/g, " ");
        if (!tag || seen.has(tag)) continue;
        seen.add(tag);
        values.push(tag);
      }
    }
    return values;
  } catch {
    return [];
  }
}

function buildRenameMap(oldTags: string[], newTags: string[]) {
  const map = new Map<string, string>();
  const newSet = new Set(newTags);
  const len = Math.max(oldTags.length, newTags.length);

  for (let i = 0; i < len; i += 1) {
    const from = oldTags[i];
    const to = newTags[i];
    if (!from || !to || from === to) continue;
    if (newSet.has(from)) continue;
    if (map.has(from)) continue;
    map.set(from, to);
  }

  return map;
}

async function syncArticleTagsWithDataList(previousItems: string[], nextItems: string[]) {
  if (!prisma) return;

  const model = prisma.article;
  const renameMap = buildRenameMap(previousItems, nextItems);
  const allowedSet = new Set(nextItems);
  const rows = await model.findMany({ select: { id: true, tags: true } });

  for (const row of rows) {
    const transformed: string[] = [];
    const seen = new Set<string>();
    let changed = false;

    for (const rawTag of row.tags ?? []) {
      if (typeof rawTag !== "string") {
        changed = true;
        continue;
      }
      const tag = rawTag.trim().replace(/\s+/g, " ");
      if (!tag) {
        changed = true;
        continue;
      }

      const renamed = renameMap.get(tag) ?? tag;
      if (!allowedSet.has(renamed)) {
        changed = true;
        continue;
      }
      if (seen.has(renamed)) {
        changed = true;
        continue;
      }

      if (renamed !== tag) changed = true;
      seen.add(renamed);
      transformed.push(renamed);
    }

    if (!changed && transformed.length === row.tags.length) {
      continue;
    }

    await model.update({
      where: { id: row.id },
      data: { tags: transformed },
    });
  }
}

                                            
export async function getAllDataLists() {
  try {
    if (!prisma) return [];
    return await prisma.dataList.findMany({
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    console.error('Error fetching data lists:', error);
    return [];
  }
}

                                                  
export async function getDataList(slug: string) {
  try {
    if (!prisma) return null;
    const dataList = await prisma.dataList.findUnique({
      where: { slug },
    });

    if (!dataList) {
                                        
      const name = getListNameBySlug(slug);
      const defaultItems = getDefaultItemsBySlug(slug);
      
      return await prisma.dataList.create({
        data: {
          slug,
          name,
          items: defaultItems,
        },
      });
    }

    return dataList;
  } catch (error) {
    console.error(`Error fetching data list ${slug}:`, error);
    return null;
  }
}

                                                         
function convertJsonToStringArray(items: any): string[] {
  return normalizeStringList(items);
}

                                                                      
export async function getDataListItems(slug: string): Promise<string[]> {
  try {
    if (!prisma) return getDefaultItemsBySlug(slug);
                                          
    const defaultItems =
      slug === "article-tags" ? await getExistingArticleTags() : getDefaultItemsBySlug(slug);
    
                            
    const dataList = await prisma.dataList.findUnique({
      where: { slug },
    });

    if (!dataList) {
                                               
      await prisma.dataList.create({
        data: {
          slug,
          name: getListNameBySlug(slug),
          items: defaultItems,
        },
      });
      return defaultItems;
    }

                                                              
    const currentItems = convertJsonToStringArray(dataList.items);
    
    if (slug === 'paradigms' && currentItems.length < 10) {
      console.log('⚠️ Обнаружены старые данные парадигм, обновляем...');
                                                 
      await prisma.dataList.update({
        where: { slug },
        data: { items: defaultItems },
      });
      return defaultItems;
    }

    if (slug === "article-tags" && currentItems.length === 0) {
      const actualTags = await getExistingArticleTags();
      if (actualTags.length > 0) {
        await prisma.dataList.update({
          where: { slug },
          data: { items: actualTags },
        });
        return actualTags;
      }
    }

    return currentItems;
  } catch (error) {
    console.error(`Error fetching data list items ${slug}:`, error);
    if (slug === "article-tags") {
      return await getExistingArticleTags();
    }
    return getDefaultItemsBySlug(slug);                                        
  }
}

                                       
export async function updateDataList(slug: string, items: string[]) {
  try {
    if (!prisma) return { success: false, error: 'База данных недоступна' };
    const normalizedItems = normalizeStringList(items);
    const previous = await prisma.dataList.findUnique({
      where: { slug },
      select: { items: true },
    });
    const previousItems = normalizeStringList(previous?.items);

    await prisma.dataList.upsert({
      where: { slug },
      update: { items: normalizedItems },
      create: {
        slug,
        name: getListNameBySlug(slug),
        items: normalizedItems,
      },
    });

    if (slug === "article-tags") {
      await syncArticleTagsWithDataList(previousItems, normalizedItems);
      revalidateTag("articles", "max");
      revalidatePath("/admin/articles");
      revalidatePath("/managers/articles");
      revalidatePath("/lib/articles");
      revalidatePath("/lib/articles/[slug]", "page");
    }

    revalidatePath('/managers/ListDate');
    return { success: true };
  } catch (error) {
    console.error(`Error updating data list ${slug}:`, error);
    return { success: false, error: 'Ошибка обновления' };
  }
}

                          
function getListNameBySlug(slug: string): string {
  const names: Record<string, string> = {
    'work-formats': 'Форматы работы',
    'paradigms': 'Парадигмы',
    'certification-levels': 'Уровни сертификации',
    'article-tags': 'Тэги статей',
  };
  return names[slug] || slug;
}

function getDefaultItemsBySlug(slug: string): string[] {
  const defaults: Record<string, string[]> = {
    'work-formats': ['Онлайн и оффлайн', 'Только онлайн', 'Только оффлайн', 'Переписка'],
    'paradigms': PARADIGM_OPTIONS.map(p => p.value),                                    
    'certification-levels': ['1', '2', '3'],
    'article-tags': [],
  };
  return defaults[slug] || [];
}
