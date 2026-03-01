import Link from "next/link";
import { getArticles, getArticleTags } from "@/app/actions/articles";
import { buildMetadata } from "@/lib/seo";
import { Calendar, Tag, ArrowLeft, ArrowRight, User, Sparkles, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 60;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const tag = typeof params?.tag === "string" ? params.tag : undefined;

  return buildMetadata({
    title: tag ? `Статьи по теме «${tag}» — Библиотека — Давай вместе` : "Статьи — Библиотека — Давай вместе",
    description: tag
      ? `Статьи по психологии на тему «${tag}» от психологов реестра «Давай вместе».`
      : "Тематические статьи по психологии и психотерапии от психологов реестра «Давай вместе».",
    path: "/lib/articles",
  });
}

function formatDate(value: Date | string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ArticlesListPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params?.page) || 1;
  const tag = typeof params?.tag === "string" ? params.tag : undefined;

  const [result, tags] = await Promise.all([getArticles({ page, tag }), getArticleTags()]);

  const featuredArticle = result.items[0] ?? null;
  const articleGrid = result.items.slice(1);

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-[#5858E2]/20 bg-gradient-to-br from-[#5858E2] via-[#6d6dee] to-[#3b3bc1] px-6 py-8 text-white shadow-[0_24px_60px_-28px_rgba(88,88,226,0.6)] sm:px-10 sm:py-10">
          <div className="pointer-events-none absolute -right-20 -top-16 h-56 w-56 rounded-full bg-[#A7FF5A]/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-16 h-56 w-56 rounded-full bg-white/15 blur-3xl" />

          <div className="relative">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] sm:text-sm">
              <Sparkles className="h-4 w-4" />
              Библиотека «Давай вместе»
            </div>

            <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
              {tag ? `Статьи о «${tag}»` : "Статьи от практикующих психологов"}
            </h1>

            <p className="mt-4 max-w-3xl text-sm text-white/85 sm:text-base md:text-lg">
              {tag
                ? `Подборка материалов по теме «${tag}» с практическим взглядом и опытом специалистов.`
                : "Подборки без воды: тревога, отношения, границы, самооценка, кризисы и другие темы, с которыми приходят в терапию."}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium">
                {result.total} материалов в базе
              </span>
              <span className="rounded-2xl border border-[#A7FF5A]/40 bg-[#A7FF5A]/20 px-4 py-2 text-sm font-medium text-[#0a2600]">
                Страница {result.page} из {result.totalPages}
              </span>
            </div>
          </div>
        </section>

        {tags.length > 0 && (
          <section className="mt-8 rounded-3xl border border-[#5858E2]/15 bg-white p-5 shadow-[0_20px_40px_-30px_rgba(58,58,58,0.45)] sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#5858E2]">
                <Tag className="h-4 w-4" />
                Фильтр по темам
              </div>
              {tag && (
                <Link href="/lib/articles" className="text-xs font-semibold text-[#5858E2] hover:text-[#3f3fb2] sm:text-sm">
                  Сбросить
                </Link>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/lib/articles"
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                  !tag
                    ? "bg-[#5858E2] text-white shadow-[0_10px_24px_-12px_rgba(88,88,226,0.85)]"
                    : "bg-[#EEF0FF] text-[#4a4abf] hover:bg-[#dfe3ff]"
                }`}
              >
                Все темы
              </Link>

              {tags.map((t) => (
                <Link
                  key={t}
                  href={tag === t ? "/lib/articles" : `/lib/articles?tag=${encodeURIComponent(t)}`}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                    tag === t
                      ? "bg-[#A7FF5A] text-[#172104] shadow-[0_10px_24px_-16px_rgba(61,102,16,0.85)]"
                      : "bg-[#EEF0FF] text-[#4a4abf] hover:bg-[#dfe3ff]"
                  }`}
                >
                  #{t}
                </Link>
              ))}
            </div>
          </section>
        )}

        {result.items.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-[#5858E2]/15 bg-white px-6 py-16 text-center shadow-[0_20px_40px_-30px_rgba(58,58,58,0.45)]">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF0FF] text-[#5858E2]">
              <Tag className="h-7 w-7" />
            </div>
            <h2 className="font-display text-2xl font-bold text-[#222]">Пока нет материалов</h2>
            <p className="mt-2 text-sm text-neutral-dark sm:text-base">
              Скоро здесь появятся новые статьи и разборы от психологов проекта.
            </p>

            {tag && (
              <Link
                href="/lib/articles"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#5858E2] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#4b4bcf]"
              >
                <ArrowLeft className="h-4 w-4" />
                Показать все статьи
              </Link>
            )}
          </section>
        ) : (
          <section className="mt-8 space-y-6">
            {featuredArticle && (
              <article className="group relative overflow-hidden rounded-3xl border border-[#5858E2]/20 bg-white p-6 shadow-[0_24px_50px_-34px_rgba(88,88,226,0.75)] sm:p-8">
                <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#A7FF5A]/30 blur-3xl" />

                <div className="relative">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#EEF0FF] px-3 py-1 text-xs font-semibold text-[#5858E2]">
                    <Sparkles className="h-3.5 w-3.5" />
                    Выбор редакции
                  </div>

                  <h2 className="font-display text-2xl font-bold leading-tight text-[#141414] sm:text-3xl">
                    {featuredArticle.title}
                  </h2>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-neutral-dark">
                    {featuredArticle.authorName && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F5F5F7] px-3 py-1.5">
                        <User className="h-4 w-4 text-[#5858E2]" />
                        {featuredArticle.authorName}
                      </span>
                    )}
                    {featuredArticle.publishedAt && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F5F5F7] px-3 py-1.5">
                        <Calendar className="h-4 w-4 text-[#5858E2]" />
                        {formatDate(featuredArticle.publishedAt)}
                      </span>
                    )}
                  </div>

                  {featuredArticle.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {featuredArticle.tags.slice(0, 5).map((t: string) => (
                        <span
                          key={t}
                          className="rounded-full border border-[#5858E2]/25 bg-[#5858E2]/5 px-3 py-1 text-xs font-semibold text-[#5858E2]"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  <Link
                    href={`/lib/articles/${featuredArticle.slug}`}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#5858E2] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4b4bcf]"
                  >
                    Читать статью
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </article>
            )}

            {articleGrid.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {articleGrid.map((article, index: number) => (
                  <article
                    key={article.id}
                    className="group overflow-hidden rounded-2xl border border-[#5858E2]/15 bg-white shadow-[0_18px_36px_-30px_rgba(88,88,226,0.75)] transition-all hover:-translate-y-0.5 hover:border-[#5858E2]/35"
                  >
                    <Link href={`/lib/articles/${article.slug}`} className="block p-5">
                      <div
                        className={`mb-4 h-1.5 w-16 rounded-full ${
                          index % 3 === 0 ? "bg-[#5858E2]" : index % 3 === 1 ? "bg-[#A7FF5A]" : "bg-[#8f8ff0]"
                        }`}
                      />

                      <h3 className="font-display text-xl font-bold leading-snug text-[#1f1f1f] transition-colors group-hover:text-[#5858E2]">
                        {article.title}
                      </h3>

                      <div className="mt-3 space-y-2 text-sm text-neutral-dark">
                        {article.authorName && (
                          <p className="inline-flex items-center gap-2">
                            <User className="h-4 w-4 text-[#5858E2]" />
                            {article.authorName}
                          </p>
                        )}
                        {article.publishedAt && (
                          <p className="inline-flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-[#5858E2]" />
                            {formatDate(article.publishedAt)}
                          </p>
                        )}
                      </div>

                      {article.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {article.tags.slice(0, 3).map((t: string) => (
                            <span key={t} className="rounded-full bg-[#EEF0FF] px-2.5 py-1 text-xs font-semibold text-[#5353d6]">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#5858E2]">
                        Читать
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {result.totalPages > 1 && (
          <nav className="mt-10 rounded-2xl border border-[#5858E2]/15 bg-white p-4 shadow-[0_20px_40px_-30px_rgba(58,58,58,0.45)] sm:p-5">
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-sm text-neutral-dark">
                Страница {result.page} из {result.totalPages}
              </p>

              <div className="flex w-full gap-2 sm:w-auto">
                {result.page > 1 && (
                  <Link
                    href={
                      tag
                        ? `/lib/articles?page=${result.page - 1}&tag=${encodeURIComponent(tag)}`
                        : `/lib/articles?page=${result.page - 1}`
                    }
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#5858E2]/20 px-4 py-2.5 text-sm font-semibold text-[#4a4abf] hover:bg-[#EEF0FF] sm:flex-none"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Назад
                  </Link>
                )}

                {result.page < result.totalPages && (
                  <Link
                    href={
                      tag
                        ? `/lib/articles?page=${result.page + 1}&tag=${encodeURIComponent(tag)}`
                        : `/lib/articles?page=${result.page + 1}`
                    }
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#5858E2] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#4b4bcf] sm:flex-none"
                  >
                    Вперед
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          </nav>
        )}

        <div className="mt-10 text-center">
          <Link
            href="/lib"
            className="inline-flex items-center gap-2 rounded-xl border border-[#5858E2]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#4a4abf] hover:bg-[#EEF0FF]"
          >
            <ArrowLeft className="h-4 w-4" />
            Вернуться в библиотеку
          </Link>
        </div>
      </div>
    </div>
  );
}
