import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";
import { prisma } from "@/lib/prisma";

const BASE = SITE.baseUrl.replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/catalog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/articles`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/articles/rss`, lastModified: new Date(), changeFrequency: "daily", priority: 0.5 },
  ];

  let psychologistPages: MetadataRoute.Sitemap = [];
  let articlePages: MetadataRoute.Sitemap = [];
  let pagePages: MetadataRoute.Sitemap = [];

  if (prisma) {
    try {
      const [psychologists, articles, pages] = await Promise.all([
        prisma.user.findMany({
          where: { isPublished: true, status: 'ACTIVE' },
          select: { slug: true, updatedAt: true },
        }),
        prisma.article.findMany({
          where: { publishedAt: { not: null } },
          select: { slug: true, updatedAt: true },
        }),
        prisma.page.findMany({
          where: { isPublished: true },
          select: { slug: true, updatedAt: true },
        }),
      ]);
      psychologistPages = psychologists
        .filter((p): p is { slug: string; updatedAt: Date } => p.slug !== null)
        .map((p) => ({
          url: `${BASE}/catalog/${p.slug}`,
          lastModified: p.updatedAt,
          changeFrequency: "monthly" as const,
          priority: 0.7,
        }));
      articlePages = articles
        .filter((a): a is { slug: string; updatedAt: Date } => a.slug !== null)
        .map((a) => ({
          url: `${BASE}/articles/${a.slug}`,
          lastModified: a.updatedAt ?? new Date(),
          changeFrequency: "monthly" as const,
          priority: 0.6,
        }));
      pagePages = pages
        .filter((p): p is { slug: string; updatedAt: Date } => p.slug !== null && !p.slug.startsWith('/'))
        .map((p) => ({
          url: `${BASE}/${p.slug}`,
          lastModified: p.updatedAt,
          changeFrequency: "monthly" as const,
          priority: 0.6,
        }));
    } catch {
                                                     
    }
  }

  return [...staticPages, ...psychologistPages, ...articlePages, ...pagePages];
}