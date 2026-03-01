import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

const ARTICLE_TAGS_SLUG = "article-tags";

                                
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
          name: "Тэги статей",
          items: fromArticles,
        },
        create: {
          slug: ARTICLE_TAGS_SLUG,
          name: "Тэги статей",
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

                                     
export async function getArticles({ tag, authorId, catalogSlug, publishedOnly }: {
  tag?: string;
  authorId?: string;
  catalogSlug?: string;
  publishedOnly?: boolean;
} = {}) {
  return getArticlesCached(
    tag ?? null,
    authorId ?? null,
    catalogSlug ?? null,
    Boolean(publishedOnly)
  );
}

                             
export async function getArticleById(id: string) {
  try {
    const model = checkPrismaModel();
    
    const article = await model.findUnique({
      where: { id },
      include: { author: true },
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
  catalogSlug?: string | null;
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
      shortText: data.shortText ?? null,
      content: data.content,
      tags: safeTags,
      catalogSlug: data.catalogSlug,
      publishedAt: data.isPublished ? new Date() : null,
    };
    
                                            
    if (data.authorId) {
      createData.author = {
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
  catalogSlug?: string | null;
  isPublished?: boolean;
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
      ...(data.shortText !== undefined ? { shortText: data.shortText } : {}),
      ...(data.content !== undefined ? { content: data.content } : {}),
      ...(normalizedTags !== undefined ? { tags: normalizedTags } : {}),
      ...(data.catalogSlug !== undefined ? { catalogSlug: data.catalogSlug } : {}),
    };

                            
    if (data.isPublished !== undefined) {
      updateData.publishedAt = data.isPublished ? new Date() : null;
    }

                                                       
    if (data.authorId !== undefined) {
      if (data.authorId && data.authorId !== "") {
        updateData.author = {
          connect: { id: data.authorId }
        };
      } else {
        updateData.author = {
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
        include: { author: true },
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
    catalogSlug: string | null,
    publishedOnly: boolean
  ) => {
    try {
      const model = checkPrismaModel();
      return await model.findMany({
        where: {
          ...(tag ? { tags: { has: tag } } : {}),
          ...(authorId ? { authorId } : {}),
          ...(catalogSlug ? { catalogSlug } : {}),
          ...(publishedOnly ? { publishedAt: { not: null } } : {}),
        },
        orderBy: { publishedAt: "desc" },
        include: { author: true },
      });
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
