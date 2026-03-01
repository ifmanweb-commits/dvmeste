import type { MetadataRoute } from "next";
import { SITE } from "@/config/site";
import { prisma } from "@/lib/db";

const BASE = SITE.baseUrl.replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/psy-list`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/courses`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/lib`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/lib/articles`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/connect`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/contacts`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/certification-levels`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE}/complaint`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  let psychologistPages: MetadataRoute.Sitemap = [];
  let articlePages: MetadataRoute.Sitemap = [];

  if (prisma) {
    try {
      const [psychologists, articles] = await Promise.all([
      prisma.psychologist.findMany({
        where: { isPublished: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.article.findMany({
        where: { publishedAt: { not: null } },
        select: { slug: true, updatedAt: true },
      }),
    ]);
    psychologistPages = psychologists.map((p: { slug: string; updatedAt: Date }) => ({
      url: `${BASE}/psy-list/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
    articlePages = articles.map((a: { slug: string; updatedAt: Date }) => ({
      url: `${BASE}/lib/articles/${a.slug}`,
      lastModified: a.updatedAt ?? new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
    } catch {
                                                    
    }
  }

  return [...staticPages, ...psychologistPages, ...articlePages];
}
