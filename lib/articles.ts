import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { ModerationStatus } from "@prisma/client";
import { rename } from "fs/promises";
import path from "path";

const ARTICLE_TAGS_SLUG = "article-tags";
// Единый объект для include автора
const articleInclude = {
  user: {
    select: {
      id: true,
      fullName: true,
      email: true,
      slug: true,
      avatarUrl: true,
      certificationLevel: true,
      shortBio: true,
    }
  }
} as const;
                                
function checkPrismaModel() {
  if (!prisma) {
    throw new Error("Prisma client is not initialized");
  }

                                                           
  if (!prisma.article) {
    throw new Error("Model 'article' not found in Prisma schema");
  }
  
  return prisma.article;
}

function normalizeTag(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function normalizeTagList(values: unknown[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const raw of values) {
    const tag = normalizeTag(raw);
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    normalized.push(tag);
  }
  return normalized;
}

async function getAllowedArticleTags(model: ReturnType<typeof checkPrismaModel>): Promise<string[]> {
  if (!prisma) return [];

  try {
    const dataList = await prisma.dataList.findUnique({
      where: { slug: ARTICLE_TAGS_SLUG },
      select: { items: true },
    });

    const fromDataList = normalizeTagList(Array.isArray(dataList?.items) ? dataList.items : []);
    if (fromDataList.length > 0) return fromDataList;
  } catch {
                    
  }

  const rows = await model.findMany({ select: { tags: true } });
  const fromArticles = normalizeTagList(rows.flatMap((row) => row.tags ?? []));

                                                                             
  if (fromArticles.length > 0 && prisma) {
    try {
      await prisma.dataList.upsert({
        where: { slug: ARTICLE_TAGS_SLUG },
        update: {
          title: "Тэги статей",
          items: fromArticles,
        },
        create: {
          slug: ARTICLE_TAGS_SLUG,
          title: "Тэги статей",
          items: fromArticles,
        },
      });
    } catch {
                                                                       
    }
  }

  return fromArticles;
}

function validateAndNormalizeArticleTags(inputTags: unknown[], allowedTags: string[]) {
  const allowedSet = new Set(allowedTags.map(normalizeTag));
  const normalizedInput = normalizeTagList(inputTags);
  const invalid = normalizedInput.filter((tag) => !allowedSet.has(tag));
  const valid = normalizedInput.filter((tag) => allowedSet.has(tag));
  return { valid, invalid };
}

                                                 
export async function getArticleBySlug(slug: string) {
  return getArticleBySlugCached(slug);
}

                                     
export async function getArticles({ 
  tag, 
  authorId, 
  publishedOnly, 
  search,
  page,
  limit 
}: {
  tag?: string;
  authorId?: string;
  publishedOnly?: boolean;
  search?: string;
  page?: number;
  limit?: number;
} = {}): Promise<
  | { articles: any[]; total: number; totalPages: number; page: number }
  | any[]
> {
  // Если переданы параметры пагинации — используем серверную пагинацию
  if (page !== undefined && limit !== undefined) {
    return getArticlesWithPagination({
      tag: tag ?? null,
      authorId: authorId ?? null,
      publishedOnly: Boolean(publishedOnly),
      search: search?.trim() || null,
      page,
      limit,
    });
  }
  
  // Иначе возвращаем все статьи (старое поведение)
  return getArticlesCached(
    tag ?? null,
    authorId ?? null,
    Boolean(publishedOnly),
    search?.trim() || null
  );
}

                             
export async function getArticleById(id: string) {
  try {
    const model = checkPrismaModel();
    
    const article = await model.findUnique({
      where: { id },
      include: articleInclude,
    });
    
    
    return article ?? null;
  } catch (error) {
    console.error("[getArticleById] Error:", error);
    return null;
  }
}

export interface CreateArticleInput {
  title: string;
  slug: string;
  shortText?: string;
  content: string;
  tags: string[];
  authorId?: string | null;
  isPublished?: boolean;
  draftFilesKey?: string; // Ключ draft-папки для перемещения файлов
  moderationStatus?: string; // Статус модерации (по умолчанию DRAFT, для админки - APPROVED)
}

function revalidateArticleViews(slugs: Array<string | null | undefined> = []) {
  revalidateTag("articles", "max");

                                  
  revalidatePath("/lib/articles");
  revalidatePath("/lib/articles/[slug]", "page");

                                            
  revalidatePath("/admin/articles");
  revalidatePath("/managers/articles");

  const uniqSlugs = Array.from(
    new Set(
      slugs
        .map((slug) => (typeof slug === "string" ? slug.trim() : ""))
        .filter(Boolean)
    )
  );

  for (const slug of uniqSlugs) {
    revalidatePath(`/lib/articles/${slug}`);
  }
}

// Функция для перемещения файлов из draft-папки в папку статьи
async function moveDraftFilesToArticle(draftKey: string, articleId: string): Promise<{ url: string; storagePath: string }[]> {
  const draftDir = path.join(process.cwd(), "public", "files", "articles", draftKey);
  const articleDir = path.join(process.cwd(), "public", "files", "articles", articleId);
  
  const movedImages: { url: string; storagePath: string }[] = [];
  
  try {
    // Проверяем существование draft-папки
    const fs = require('fs').promises;
    await fs.access(draftDir);
    
    // Создаём папку статьи, если её нет
    await fs.mkdir(articleDir, { recursive: true });
    
    // Читаем файлы из draft-папки
    const files = await fs.readdir(draftDir);
    
    for (const file of files) {
      const srcPath = path.join(draftDir, file);
      const destPath = path.join(articleDir, file);
      
      // Проверяем, что это файл
      const stat = await fs.stat(srcPath);
      if (!stat.isFile()) continue;
      
      // Перемещаем файл
      await fs.rename(srcPath, destPath);
      
      // Если это изображение — добавляем в список для БД
      const publicUrl = `/files/articles/${articleId}/${file}`;
      if (file.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i)) {
        movedImages.push({
          url: publicUrl,
          storagePath: destPath
        });
      }
    }
    
    // Удаляем пустую draft-папку
    await fs.rmdir(draftDir);
    
    console.log(`[createArticle] Перемещено ${movedImages.length} изображений из ${draftKey} в ${articleId}`);
  } catch (error) {
    console.error(`[createArticle] Ошибка перемещения файлов из ${draftKey}:`, error);
    // Не выбрасываем ошибку, чтобы не прерывать создание статьи
  }
  
  return movedImages;
}

export async function createArticle(data: CreateArticleInput) {
  try {
    const model = checkPrismaModel();
    
    console.log("[createArticle] input:", data);
    
                                 
    const exists = await model.findUnique({ where: { slug: data.slug } });
    if (exists) {
      throw new Error("Статья с таким slug уже существует");
    }

    const allowedTags = await getAllowedArticleTags(model);
    const { valid: safeTags, invalid } = validateAndNormalizeArticleTags(data.tags || [], allowedTags);
    if (invalid.length > 0) {
      throw new Error(`Недопустимые тэги: ${invalid.join(", ")}`);
    }
    
                                    
    const createData: Prisma.ArticleCreateInput = {
      title: data.title,
      slug: data.slug,
      excerpt: data.shortText ?? null,
      content: data.content,
      tags: safeTags,
      publishedAt: data.isPublished ? new Date() : null,
      moderationStatus: data.moderationStatus ? data.moderationStatus as ModerationStatus : ModerationStatus.DRAFT,
    };
    
                                            
    if (data.authorId) {
      createData.user = {
        connect: { id: data.authorId }
      };
    }
    
    const article = await model.create({ data: createData });
    console.log("[createArticle] created:", article);
    
    // Если есть draftFilesKey — перемещаем файлы
    if (data.draftFilesKey) {
      const movedImages = await moveDraftFilesToArticle(data.draftFilesKey, article.id);
      
      // Создаём записи в БД для изображений
      if (movedImages.length > 0) {
        await prisma.articleImage.createMany({
          data: movedImages.map(img => ({
            articleId: article.id,
            url: img.url,
            storagePath: img.storagePath
          }))
        });
        console.log(`[createArticle] Создано ${movedImages.length} записей ArticleImage`);
      }
    }
    
    revalidateArticleViews([article.slug, data.slug]);
    return article;
  } catch (e) {
    console.error("[createArticle] error:", e);
    throw e;
  }
}

                  
                  
export async function updateArticle(id: string, data: {
  title?: string;
  slug?: string;
  shortText?: string;
  content?: string;
  tags?: string[];
  authorId?: string | null;
  isPublished?: boolean;
  moderationStatus?: string;
  submittedAt?: Date | null;
}) {
  try {
    const model = checkPrismaModel();
    const current = await model.findUnique({
      where: { id },
      select: { slug: true },
    });
    
                                                 
    if (data.slug) {
      const exists = await model.findUnique({ where: { slug: data.slug } });
      if (exists && exists.id !== id) {
        throw new Error("Статья с таким slug уже существует");
      }
    }
    
                                      
    let normalizedTags: string[] | undefined;
    if (data.tags !== undefined) {
      const allowedTags = await getAllowedArticleTags(model);
      const { valid: safeTags, invalid } = validateAndNormalizeArticleTags(data.tags || [], allowedTags);
      if (invalid.length > 0) {
        throw new Error(`Недопустимые тэги: ${invalid.join(", ")}`);
      }
      normalizedTags = safeTags;
    }

    const updateData: Prisma.ArticleUpdateInput = {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.slug !== undefined ? { slug: data.slug } : {}),
      ...(data.shortText !== undefined ? { excerpt: data.shortText } : {}),
      ...(data.content !== undefined ? { content: data.content } : {}),
      ...(normalizedTags !== undefined ? { tags: normalizedTags } : {}),
      ...(data.moderationStatus !== undefined ? { moderationStatus: data.moderationStatus as ModerationStatus } : {}),
      ...(data.submittedAt !== undefined ? { submittedAt: data.submittedAt } : {}),
    };

                            
    if (data.isPublished !== undefined) {
      updateData.isPublished = data.isPublished;
      updateData.publishedAt = data.isPublished ? new Date() : null;
    }

                                                       
    if (data.authorId !== undefined) {
      if (data.authorId && data.authorId !== "") {
        updateData.user = {
          connect: { id: data.authorId }
        };
      } else {
        updateData.user = {
          disconnect: true
        };
      }
    }
    
    const updated = await model.update({
      where: { id },
      data: updateData,
    });
    revalidateArticleViews([current?.slug, updated.slug, data.slug]);
    return updated;
  } catch (error) {
    console.error("[updateArticle] error:", error);
    throw error;
  }
}

                 
export async function deleteArticle(id: string) {
  try {
    const model = checkPrismaModel();
    
    const current = await model.findUnique({
      where: { id },
      select: { slug: true },
    });

    // Получаем все изображения статьи перед удалением
    const images = await prisma.articleImage.findMany({
      where: { articleId: id },
      select: { storagePath: true }
    });

    // Удаляем файлы с диска
    const fs = require('fs').promises;
    for (const image of images) {
      try {
        if (image.storagePath) {
          await fs.unlink(image.storagePath);
        }
      } catch (err) {
        console.warn(`[deleteArticle] Не удалось удалить файл ${image.storagePath}:`, err);
      }
    }

    // Также удаляем папку статьи, если она пуста
    try {
      const articleDir = path.join(process.cwd(), "public", "files", "articles", id);
      await fs.rmdir(articleDir);
    } catch (err) {
      // Папка может не существовать или не быть пустой — это нормально
      console.log(`[deleteArticle] Не удалось удалить папку статьи:`, err);
    }

    // Удаляем статью (каскадом удалятся ArticleImage)
    const deleted = await model.delete({ where: { id } });
    revalidateArticleViews([current?.slug, deleted.slug]);
    return deleted;
  } catch (error) {
    console.error("[deleteArticle] error:", error);
    throw error;
  }
}

                               
export async function getAllArticleTags() {
  return getAllArticleTagsCached();
}

const getArticleBySlugCached = unstable_cache(
  async (slug: string) => {
    try {
      const model = checkPrismaModel();
      const article = await model.findUnique({
        where: { slug },
        include: articleInclude,
      });
      return article ?? null;
    } catch (error) {
      console.error("[getArticleBySlug] Error:", error);
      return null;
    }
  },
  ["articles-by-slug"],
  { revalidate: 30, tags: ["articles"] }
);

/**
 * Получение статей с пагинацией
 */
async function getArticlesWithPagination({
  tag,
  authorId,
  publishedOnly,
  search,
  page,
  limit,
}: {
  tag: string | null;
  authorId: string | null;
  publishedOnly: boolean;
  search: string | null;
  page: number;
  limit: number;
}) {
  try {
    const model = checkPrismaModel();
    
    // Условия для поиска по названию и excerpt
    const searchCondition = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { excerpt: { contains: search, mode: 'insensitive' as const } },
          ]
        }
      : {};
    
    const where = {
      ...(tag ? { tags: { has: tag } } : {}),
      ...(authorId ? { userId: authorId } : {}),
      ...(publishedOnly ? { isPublished: true } : {}),
      ...searchCondition,
    };
    
    // Получаем общее количество статей
    const total = await model.count({ where });
    
    // Получаем статьи с пагинацией
    const articles = await model.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: articleInclude,
    });
    
    return {
      articles,
      total,
      totalPages: Math.ceil(total / limit),
      page,
    };
  } catch (error) {
    console.error("[getArticlesWithPagination] Error:", error);
    return {
      articles: [],
      total: 0,
      totalPages: 0,
      page,
    };
  }
}

const getArticlesCached = unstable_cache(
  async (
    tag: string | null,
    authorId: string | null,
    publishedOnly: boolean,
    search: string | null
  ) => {
    try {
      const model = checkPrismaModel();
      
      // Условия для поиска по названию и excerpt
      const searchCondition = search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' as const } },
              { excerpt: { contains: search, mode: 'insensitive' as const } },
            ]
          }
        : {};
      
      const articles = await model.findMany({
        where: {
          ...(tag ? { tags: { has: tag } } : {}),
          ...(authorId ? { userId: authorId } : {}),
          ...(publishedOnly ? { isPublished: true } : {}),
          ...searchCondition,
        },
        orderBy: { publishedAt: "desc" },
        include: articleInclude,
      });
      
      // Логируем первую статью, чтобы увидеть все поля
      if (articles.length > 0) {
        //console.log('First article fields:', Object.keys(articles[0]));
        //console.log('Has excerpt?', 'excerpt' in articles[0]);
      }
      
      return articles;
    } catch (error) {
      console.error("[getArticles] Error:", error);
      return [];
    }
  },
  ["articles-list"],
  { revalidate: 20, tags: ["articles"] }
);

const getAllArticleTagsCached = unstable_cache(
  async () => {
    try {
      const model = checkPrismaModel();
      
      const articles = await model.findMany({ select: { tags: true } });
      const tags = new Set<string>();
      for (const a of articles) {
        for (const t of a.tags) {
          tags.add(t);
        }
      }
      return Array.from(tags).sort();
    } catch (error) {
      console.error("[getAllArticleTags] error:", error);
      return [];
    }
  },
  ["articles-tags"],
  { revalidate: 60, tags: ["articles"] }
);

export async function getArticleTags() {
  try {
    // Используем тот же фильтр, что и в getArticles для publishedOnly
    // isPublished: true вместо publishedAt: { not: null }
    const articles = await prisma.article.findMany({
      select: { tags: true },
      where: { isPublished: true }
    });

    const tags = new Set<string>();
    articles.forEach(article => {
      article.tags?.forEach(tag => tags.add(tag));
    });

    return Array.from(tags).sort();
  } catch (error) {
    console.error("[getArticleTags] Error:", error);
    return [];
  }
}

/**
 * Получение статей для админ-панели
 * - Исключает статьи со статусом DRAFT
 * - Поддерживает пагинацию
 * - Включает информацию о модераторе
 */
export async function getArticlesForAdmin({
  page = 1,
  pageSize = 30,
  unpublishedOnly = false,
  search,
  tag,
  authorId,
}: {
  page?: number;
  pageSize?: number;
  unpublishedOnly?: boolean;
  search?: string | null;
  tag?: string | null;
  authorId?: string | null;
} = {}) {
  try {
    const model = checkPrismaModel();

    // Условия для поиска по названию и excerpt
    const searchCondition = search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { excerpt: { contains: search, mode: "insensitive" as const } },
          ]
        }
      : {};

    // Фильтр по статусу модерации (исключаем DRAFT)
    const statusFilter = {
      moderationStatus: {
        not: ModerationStatus.DRAFT
      }
    };

    // Фильтр по опубликованности
    const publishedFilter = unpublishedOnly
      ? { isPublished: false }
      : {};

    const where = {
      ...statusFilter,
      ...publishedFilter,
      ...(tag ? { tags: { has: tag } } : {}),
      ...(authorId ? { userId: authorId } : {}),
      ...searchCondition,
    };

    // Получаем общее количество статей для пагинации
    const totalCount = await model.count({ where });

    // Получаем статьи с пагинацией
    const articles = await model.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            slug: true,
            avatarUrl: true,
            certificationLevel: true,
            shortBio: true,
          }
        },
        moderator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          }
        }
      },
    });

    return {
      articles,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
    };
  } catch (error) {
    console.error("[getArticlesForAdmin] Error:", error);
    return {
      articles: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: page,
    };
  }
}