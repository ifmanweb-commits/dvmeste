import { getArticlesForAdmin } from "@/lib/articles";
import AdminArticlesClient from "./AdminArticlesClient";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  tags: string[];
  moderationStatus: string;
  publishedAt: string | null;
  isPublished: boolean;
  moderator: {
    id: string;
    fullName: string;
  } | null;
  author: {
    id: string;
    fullName: string;
  } | null;
}

export default async function ArticlesPage({ searchParams }: { searchParams: Promise<{ page?: string; unpublishedOnly?: string }> }) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;
  const unpublishedOnly = params.unpublishedOnly === 'true';

  const result = await getArticlesForAdmin({
    page,
    pageSize: 30,
    unpublishedOnly,
  });

  const formattedArticles: Article[] = result.articles.map((article: any) => ({
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: article.content,
    tags: article.tags || [],
    moderationStatus: article.moderationStatus,
    publishedAt: article.publishedAt as string | null,
    isPublished: article.isPublished,
    moderator: article.moderator ? {
      id: article.moderator.id,
      fullName: article.moderator.fullName || '—'
    } : null,
    author: article.user ? {
      id: article.user.id,
      fullName: article.user.fullName || 'Без имени'
    } : null
  }));

  return (
    <AdminArticlesClient
      initialArticles={formattedArticles}
      totalPages={result.totalPages}
      currentPage={result.currentPage}
      totalCount={result.totalCount}
    />
  );
}