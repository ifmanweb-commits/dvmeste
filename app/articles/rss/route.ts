import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/config";
import { NextResponse } from "next/server";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "\x26amp;")
    .replace(/</g, "\x3clt;")
    .replace(/>/g, "\x3egt;")
    .replace(/"/g, "\x22quot;")
    .replace(/'/g, "\x27apos;");
}

export async function GET() {
  const articles = await prisma.article.findMany({
    where: { 
      isPublished: true,
      publishedAt: { not: null }
    },
    orderBy: { publishedAt: 'desc' },
    take: 30,
    include: { 
      user: {
        select: {
          fullName: true,
          slug: true,
        }
      }
    }
  });

  const baseUrl = SITE.baseUrl.replace(/\/$/, "");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Давай вместе — Статьи</title>
    <link>${baseUrl}/articles</link>
    <description>Статьи по психологии от психологов реестра «Давай вместе»</description>
    <atom:link href="${baseUrl}/articles/rss" rel="self" type="application/rss+xml"/>
    <language>ru-ru</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${articles.map(article => `
    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${baseUrl}/articles/${article.slug}</link>
      <guid isPermaLink="true">${baseUrl}/articles/${article.slug}</guid>
      <description>${escapeXml(article.excerpt || article.content.replace(/<[^>]+>/g, '').slice(0, 200))}</description>
      <content:encoded><![CDATA[${article.content}]]></content:encoded>
      <pubDate>${new Date(article.publishedAt!).toUTCString()}</pubDate>${article.user?.fullName ? `
      <author>${escapeXml(article.user.fullName)}</author>` : ''}${article.tags.length > 0 ? `
      ${article.tags.map(tag => `<category>${escapeXml(tag)}</category>`).join('')}` : ''}
    </item>`).join('')}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: { 
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600'
    }
  });
}