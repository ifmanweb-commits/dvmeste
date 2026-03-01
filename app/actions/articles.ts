"use server";

import { prisma } from "@/lib/db";
import { unstable_cache } from "next/cache";

const ARTICLES_PAGE_SIZE = 12;

export type ArticleListItem = {
  id: string;
  title: string;
  slug: string;
  tags: string[];
  publishedAt: Date | null;
  authorName: string | null;
};

export type ArticlesResult = {
  items: ArticleListItem[];
  total: number;
  page: number;
  totalPages: number;
};

export async function getArticles(options: {
  page?: number;
  tag?: string;
  limit?: number;
}): Promise<ArticlesResult> {
  if (!prisma) return { items: [], total: 0, page: 1, totalPages: 0 };

  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(ARTICLES_PAGE_SIZE, options.limit ?? ARTICLES_PAGE_SIZE);
  const tag = options.tag?.trim();

  return getArticlesCached(page, limit, tag ?? null);
}

export async function getArticleBySlug(slug: string): Promise<{
  id: string;
  title: string;
  slug: string;
  content: string;
  tags: string[];
  publishedAt: Date | null;
  author: {
    id: string;
    slug: string;
    fullName: string;
    shortBio: string;
    certificationLevel: number;
    images: string[];
  } | null;
} | null> {
  if (!prisma) return null;
  return getArticleBySlugCached(slug);
}

export async function getArticleTags(): Promise<string[]> {
  if (!prisma) return [];
  return getArticleTagsCached();
}

const getArticlesCached = unstable_cache(
  async (page: number, limit: number, tag: string | null): Promise<ArticlesResult> => {
    if (!prisma) return { items: [], total: 0, page: 1, totalPages: 0 };

    const where = {
      publishedAt: { not: null },
      ...(tag ? { tags: { has: tag } } : {}),
    };

    try {
      const [items, total] = await Promise.all([
        prisma.article.findMany({
          where,
          orderBy: { publishedAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            title: true,
            slug: true,
            tags: true,
            publishedAt: true,
            author: { select: { fullName: true } },
          },
        }),
        prisma.article.count({ where }),
      ]);
      const totalPages = Math.max(1, Math.ceil(total / limit));
      return {
        items: items.map((a) => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          tags: a.tags ?? [],
          publishedAt: a.publishedAt,
          authorName: a.author?.fullName ?? null,
        })),
        total,
        page,
        totalPages,
      };
    } catch {
      return { items: [], total: 0, page: 1, totalPages: 0 };
    }
  },
  ["public-articles-list"],
  { revalidate: 30, tags: ["articles"] }
);

const getArticleBySlugCached = unstable_cache(
  async (slug: string) => {
    if (!prisma) return null;
    try {
      const a = await prisma.article.findUnique({
        where: { slug, publishedAt: { not: null } },
        select: {
          id: true,
          title: true,
          slug: true,
          content: true,
          tags: true,
          publishedAt: true,
          author: {
            select: {
              id: true,
              slug: true,
              fullName: true,
              shortBio: true,
              certificationLevel: true,
              images: true,
            },
          },
        },
      });
      if (!a) return null;
      return { ...a, author: a.author ?? null };
    } catch {
      return null;
    }
  },
  ["public-article-by-slug"],
  { revalidate: 30, tags: ["articles"] }
);

const getArticleTagsCached = unstable_cache(
  async (): Promise<string[]> => {
    if (!prisma) return [];
    try {
      const rows = await prisma.article.findMany({
        where: { publishedAt: { not: null } },
        select: { tags: true },
      });
      const set = new Set<string>();
      for (const r of rows) {
        for (const t of r.tags ?? []) if (t) set.add(t);
      }
      return Array.from(set).sort();
    } catch {
      return [];
    }
  },
  ["public-article-tags"],
  { revalidate: 60, tags: ["articles"] }
);
