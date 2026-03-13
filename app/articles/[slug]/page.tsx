import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleBySlug, getArticles } from "@/lib/articles";
import { Badge } from "@/components/ui";
import { buildMetadata } from "@/lib/seo";
import { normalizeImageSrc, isExternalImageSrc } from "@/lib/image-src";
import { normalizeEmbeddedLocalAssetUrls } from "@/lib/html-local-assets";
import { Calendar, User, ArrowLeft, Clock, Share2, ArrowUp } from "lucide-react";
import styles from './articles.module.css';
import { prisma } from "@/lib/prisma";
import { ArticleClient } from "../ArticleClient";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article)
    return buildMetadata({ title: "Статья", path: `/articles/${slug}` });
  return buildMetadata({
    title: article.title,
    description: article.content.slice(0, 160).replace(/<[^>]+>/g, ""),
    path: `/articles/${slug}`,
  });
}

// Функция для подсчета времени чтения (реальная)
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const text = content
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/&[a-z]+;/g, ' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();
  
  const articleContent = normalizeEmbeddedLocalAssetUrls(article.content || "");
  const author = article.user;
  
  // Получаем фото автора
  let authorImage = null;
  if (author) {
    authorImage = author.avatarUrl;
  }
  
  // Получаем другие статьи автора
  const authorArticles = author 
    ? await getArticles({ authorId: author.id, publishedOnly: true })
    : [];
  const otherAuthorArticles = authorArticles
    .filter(a => a.id !== article.id)
    .slice(0, 3);
  
  // Получаем статьи по теме (с таким же первым тегом)
  const topicArticles = article.tags.length > 0
    ? await getArticles({ tag: article.tags[0], publishedOnly: true })
    : [];
  const otherTopicArticles = topicArticles
    .filter(a => a.id !== article.id)
    .slice(0, 3);
  
  // Время чтения
  const readingTime = calculateReadingTime(article.content);

  return (
    <div className="min-h-screen bg-[#F5F5F7] relative">
      <ArticleClient />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Навигация */}
        <Link
          href="/articles"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#5858E2] transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад к списку статей
        </Link>

        {/* Основной лейаут */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Левая колонка — автор (стики) и по теме */}
          <div className="lg:w-64 order-2 lg:order-1">
            <div className="space-y-6 lg:sticky lg:top-24">
              
              {/* Блок автора (стики) */}
              {author && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                    Об авторе
                  </h3>
                  <div className="flex flex-col items-center text-center">
                    {authorImage ? (
                      <div className="relative w-20 h-20 rounded-full overflow-hidden mb-3">
                        <Image
                          src={normalizeImageSrc(authorImage)}
                          alt={author.fullName || ''}
                          fill
                          className="object-cover"
                          sizes="80px"
                          unoptimized={isExternalImageSrc(authorImage)}
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
                        <User className="h-8 w-8" />
                      </div>
                    )}
                    <h4 className="font-semibold text-gray-900">
                      {author.fullName}
                    </h4>
                    <p className="text-xs text-[#5858E2] mt-1">
                      Уровень квалификации: {author.certificationLevel}
                    </p>
                    {author.shortBio && (
                      <p className="text-xs text-gray-600 mt-3 line-clamp-3">
                        {author.shortBio}
                      </p>
                    )}
                    <Link
                      href={`/catalog/${author.slug}`}
                      className="mt-4 inline-flex items-center text-xs font-medium text-[#5858E2] border border-[#5858E2] px-4 py-2 rounded-full hover:bg-[#5858E2] hover:text-white transition-colors"
                    >
                      Страница психолога
                    </Link>
                  </div>
                </div>
              )}

              {/* Блок "По теме" (всегда под автором) */}
              {otherTopicArticles.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                    🏷️ По теме
                  </h3>
                  <ul className="space-y-3">
                    {otherTopicArticles.map((a) => (
                      <li key={a.id}>
                        <Link
                          href={`/articles/${a.slug}`}
                          className="block hover:bg-gray-50 -mx-2 px-2 py-1 rounded-lg transition-colors"
                        >
                          <h4 className="text-sm font-medium text-gray-900 line-clamp-1">
                            {a.title}
                          </h4>
                          {a.user?.fullName && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {a.user.fullName}
                            </p>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/articles?tag=${article.tags[0]}`}
                    className="mt-4 inline-block text-xs font-medium text-[#5858E2] hover:underline"
                  >
                    Все по теме →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Центральная колонка — контент */}
          <div className="articleContent flex-1 max-w-3xl mx-auto lg:mx-0 order-1 lg:order-2">
            <article className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm">
              
              {/* Заголовок и мета */}
              <header className="mb-8">
                {article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {article.tags.slice(0, 1).map((t) => (
                      <span
                        key={t}
                        className="inline-block bg-[#A7FF5A] text-gray-900 text-xs font-medium px-3 py-1 rounded-full"
                      >
                        🔥 {t}
                      </span>
                    ))}
                  </div>
                )}
                
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  {article.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  {author && (
                    <span className="inline-flex items-center gap-1.5">
                      <User className="h-4 w-4 text-gray-400" />
                      {author.fullName}
                    </span>
                  )}
                  {article.publishedAt && (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {new Date(article.publishedAt).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-gray-400" />
                    {readingTime} мин чтения
                  </span>
                </div>
              </header>

              {/* Контент статьи */}
              <div
                className="prose prose-lg max-w-none
                  [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-12 [&_h2]:mb-4
                  [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-gray-800 [&_h3]:mt-8 [&_h3]:mb-3
                  [&_p]:text-gray-700 [&_p]:leading-relaxed [&_p]:mb-6
                  [&_img]:rounded-xl [&_img]:shadow-md [&_img]:my-8 [&_img]:max-w-full [&_img]:h-auto
                  [&_blockquote]:border-l-4 [&_blockquote]:border-[#A7FF5A] [&_blockquote]:bg-[#f6ffe6] [&_blockquote]:pl-6 [&_blockquote]:py-4 [&_blockquote]:pr-4 [&_blockquote]:my-8 [&_blockquote]:rounded-r-xl
                  [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-6 [&_ul]:space-y-2
                  [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-6 [&_ol]:space-y-2
                  [&_a]:text-[#5858E2] [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:no-underline"
                dangerouslySetInnerHTML={{ __html: articleContent }}
              />

              {/* Блок поделиться */}
              <div className="mt-12 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Поделиться:
                  </span>
                  <div className="flex gap-2">
                    <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-[#5858E2] hover:text-white transition-colors">
                      📘
                    </button>
                    <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-[#5858E2] hover:text-white transition-colors">
                      📢
                    </button>
                    <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-[#5858E2] hover:text-white transition-colors">
                      🔗
                    </button>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>

        {/* Другие статьи автора */}
        {otherAuthorArticles.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-6 border-l-4 border-[#A7FF5A] pl-4">
              📚 Другие статьи {author?.fullName}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherAuthorArticles.map((a) => (
                <Link
                  key={a.id}
                  href={`/articles/${a.slug}`}
                  className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all hover:-translate-y-1 hover:border-[#5858E2]/30"
                >
                  <h3 className="font-semibold text-gray-900 group-hover:text-[#5858E2] transition-colors line-clamp-2 mb-2">
                    {a.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {a.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString('ru-RU') : ''}
                    </span>
                    <span className="text-[#5858E2] group-hover:gap-1 transition-all inline-flex items-center">
                      Читать →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Другие статьи на тему */}
        {otherTopicArticles.length > 0 && otherTopicArticles !== otherAuthorArticles && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-6 border-l-4 border-[#A7FF5A] pl-4">
              🏷️ Ещё по теме «{article.tags[0]}»
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherTopicArticles.slice(0, 3).map((a) => (
                <Link
                  key={a.id}
                  href={`/articles/${a.slug}`}
                  className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all hover:-translate-y-1 hover:border-[#5858E2]/30"
                >
                  <h3 className="font-semibold text-gray-900 group-hover:text-[#5858E2] transition-colors line-clamp-2 mb-2">
                    {a.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {a.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {a.user?.fullName}
                    </span>
                    <span className="text-[#5858E2] group-hover:gap-1 transition-all inline-flex items-center">
                      Читать →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Повтор навигации внизу */}
        <div className="mt-12 pt-6 border-t border-gray-200">
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#5858E2] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад к списку статей
          </Link>
        </div>
      </div>

      
    </div>
  );
}