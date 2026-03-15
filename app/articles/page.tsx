import Link from "next/link";
import { getArticles, getArticleTags } from "@/lib/articles";
import { buildMetadata } from "@/lib/seo";
import { Calendar, Tag, ArrowLeft, ArrowRight, User, Search, X } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 60;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const tag = typeof params?.tag === "string" ? params.tag : undefined;
  const search = typeof params?.search === "string" ? params.search : undefined;

  const titlePart = tag 
    ? `Статьи по теме «${tag}»` 
    : search 
      ? `Результаты поиска «${search}»` 
      : "Статьи";

  return buildMetadata({
    title: `${titlePart} — Библиотека — Давай вместе`,
    description: tag
      ? `Статьи по психологии на тему «${tag}» от психологов реестра «Давай вместе».`
      : "Тематические статьи по психологии и психотерапии от психологов реестра «Давай вместе».",
    path: "/articles",
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
  const search = typeof params?.search === "string" ? params.search : undefined;

  // Получаем все статьи (без пагинации)
  const allArticles = await getArticles({ 
    ...(tag && { tag }), 
    ...(search && { search }),
    publishedOnly: true 
  });
  
  const tags = await getArticleTags();

  // Временная пагинация на клиенте
  const limit = 9;
  const start = (page - 1) * limit;
  const end = start + limit;
  
  const paginatedArticles = allArticles.slice(start, end);
  const total = allArticles.length;
  const totalPages = Math.ceil(total / limit);

  const featuredArticle = paginatedArticles[0] ?? null;
  const articleGrid = paginatedArticles.slice(1);

  // Функция для построения URL с сохранением параметров
  const buildUrl = (newParams: { tag?: string | null; search?: string | null; page?: number }) => {
    const urlParams = new URLSearchParams();
    
    // Явно обрабатываем каждый параметр
    // null означает "сбросить", undefined означает "оставить как есть"
    const finalTag = newParams.tag === null ? null : (newParams.tag ?? tag);
    const finalSearch = newParams.search === null ? null : (newParams.search ?? search);
    const finalPage = newParams.page ?? page;
    
    if (finalTag) urlParams.set("tag", finalTag);
    if (finalSearch) urlParams.set("search", finalSearch);
    if (finalPage > 1) urlParams.set("page", String(finalPage));
    
    const queryString = urlParams.toString();
    return queryString ? `/articles?${queryString}` : "/articles";
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        
        {/* Заголовок раздела (компактный) */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Библиотека
          </h1>
        </div>

        {/* Поиск и фильтры */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow-sm">
          
          {/* Поиск */}
          <div className="mb-5">
            <form action="/articles" method="GET">
              {/* Сохраняем текущий тег при поиске */}
              {tag && <input type="hidden" name="tag" value={tag} />}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
                <input 
                  type="text" 
                  name="search"
                  defaultValue={search}
                  placeholder="Поиск по названию и описанию..." 
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5858E2]/20 focus:border-[#5858E2]"
                />
              </div>
            </form>
            
            {/* Результаты поиска и крестик под полем */}
            {search && (
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                <span>
                  Результаты по запросу: <span className="font-medium">&laquo;{search}&raquo;</span>
                </span>
                <Link
                  href={buildUrl({ search: null, page: 1 })}
                  className="inline-flex items-center gap-1 px-2 py-1 text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 rounded-full hover:bg-gray-200"
                  title="Очистить поиск"
                >
                  <X className="h-3.5 w-3.5" />
                  <span className="text-xs">Очистить</span>
                </Link>
              </div>
            )}
          </div>

          {/* Фильтр по темам */}
          {tags.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Темы</h3>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={buildUrl({ tag: null, page: 1 })}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    !tag
                      ? "bg-[#5858E2] text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Все темы
                </Link>

                {tags.map((t) => (
                  <Link
                    key={t}
                    href={buildUrl({ tag: tag === t ? null : t, page: 1 })}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      tag === t
                        ? "bg-[#A7FF5A] text-gray-900 shadow-sm"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    #{t}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Результаты */}
        <div className="flex justify-between items-center mb-6">
          <span className="text-sm text-gray-600">
            Найдено статей: {total}
          </span>
        </div>

        {allArticles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Tag className="h-6 w-6 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {search ? "Ничего не найдено" : "Пока нет материалов"}
            </h2>
            <p className="text-gray-600">
              {search 
                ? "Попробуйте изменить параметры поиска или выбрать другую тему."
                : "Скоро здесь появятся новые статьи и разборы от психологов проекта."
              }
            </p>
            {(tag || search) && (
              <Link
                href="/articles"
                className="mt-6 inline-flex items-center gap-2 bg-[#5858E2] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-[#4b4bcf] transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Показать все статьи
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Сетка статей */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedArticles.map((article) => (
                <article
                  key={article.id}
                  className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-all hover:-translate-y-1 hover:border-[#5858E2]/30"
                >
                  <div className="p-6">

                    {/* Заголовок */}
                    <Link href={`/articles/${article.slug}`} className="block">
                      <h2 className="text-xl font-bold text-gray-900 group-hover:text-[#5858E2] transition-colors line-clamp-2 mb-3">
                        {article.title}
                      </h2>
                    </Link>

                    {/* Короткий текст (excerpt) */}
                    {article.excerpt && (
                      <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                        {article.excerpt}
                      </p>
                    )}

                    {/* Мета-информация */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      {article.user?.fullName && (
                        <span className="inline-flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {article.user.fullName}
                        </span>
                      )}
                      {article.publishedAt && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(article.publishedAt)}
                        </span>
                      )}
                    </div>

                    {/* Теги */}
                    {article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {article.tags.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              tag === t
                                ? "bg-[#A7FF5A] text-gray-900"
                                : "bg-gray-100 text-[#5858E2]"
                            }`}
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Ссылка-призыв */}
                    <div className="mt-5">
                      <Link
                        href={`/articles/${article.slug}`}
                        className="text-[#5858E2] font-medium text-sm inline-flex items-center gap-1 group-hover:gap-2 transition-all"
                      >
                        Читать статью
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Пагинация */}
            {totalPages > 1 && (
              <nav className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-4">
                <p className="text-sm text-gray-600">
                  Страница {page} из {totalPages}
                </p>
                <div className="flex gap-3 w-full sm:w-auto">
                  {page > 1 && (
                    <Link
                      href={buildUrl({ page: page - 1 })}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Назад
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={buildUrl({ page: page + 1 })}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#5858E2] text-white rounded-xl text-sm font-medium hover:bg-[#4b4bcf] transition-colors"
                    >
                      Вперед
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
