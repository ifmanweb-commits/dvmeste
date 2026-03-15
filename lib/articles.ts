import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { ModerationStatus } from "@prisma/client";

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

                                     
export async function getArticles({ tag, authorId, publishedOnly, search }: {
  tag?: string;
  authorId?: string;
  publishedOnly?: boolean;
  search?: string;
} = {}) {
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
    
    // Логируем поля
    if (article) {
      console.log('Article fields:', Object.keys(article));
      console.log('excerpt value:', article.excerpt);
    }
    
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
    };
    
                                            
    if (data.authorId) {
      createData.user = {
        connect: { id: data.authorId }
      };
    }
    
    const article = await model.create({ data: createData });
    console.log("[createArticle] created:", article);
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
          ...(publishedOnly ? { publishedAt: { not: null } } : {}),
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
    // publishedAt: { not: null } вместо isPublished: true
    const articles = await prisma.article.findMany({
      select: { tags: true },
      where: { publishedAt: { not: null } }
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
        not: "DRAFT"
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