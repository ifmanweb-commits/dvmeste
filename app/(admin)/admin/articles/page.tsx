import { getArticles } from "@/lib/articles";
import AdminArticlesClient from "./AdminArticlesClient";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  tags: string[];
  moderationStatus: string;      // ← добавить
  publishedAt: string | null;
  author: {
    id: string;
    fullName: string;
  } | null;
}

export default async function ArticlesPage() {
  const articles = await getArticles({ publishedOnly: false });
  
  const formattedArticles: Article[] = articles.map(article => ({
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: article.content,
    tags: article.tags || [],
    moderationStatus: article.moderationStatus, // ← добавить
    publishedAt: article.publishedAt as string | null,
    author: article.user ? {
      id: article.user.id,
      fullName: article.user.fullName || 'Без имени'
    } : null
  }));
  
  return <AdminArticlesClient initialArticles={formattedArticles} />;
}