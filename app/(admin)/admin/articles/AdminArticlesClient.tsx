"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArticlesTable } from "@/components/admin/ArticlesTable";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  tags: string[];
  publishedAt: string | null;
  author: {
    id: string;
    fullName: string;
  } | null;
}

export default function AdminArticlesClient({ initialArticles }: { initialArticles: Article[] }) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [allTags, setAllTags] = useState<string[]>([]);
  const [allAuthors, setAllAuthors] = useState<any[]>([]);

  // Собираем уникальные теги и авторов из статей
  useEffect(() => {
    const tagsSet = new Set<string>();
    const authorsMap = new Map<string, any>();

    initialArticles.forEach((article: Article) => {
      article.tags?.forEach(tag => tagsSet.add(tag));
      if (article.author) {
        authorsMap.set(article.author.id, article.author);
      }
    });

    setAllTags(Array.from(tagsSet));
    setAllAuthors(Array.from(authorsMap.values()));
  }, [initialArticles]);

  // Фильтрация
  useEffect(() => {
    let filtered = initialArticles;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((a: Article) =>
        a.title.toLowerCase().includes(q) ||
        (a.tags && a.tags.some((t: string) => t.toLowerCase().includes(q))) ||
        (a.author?.fullName && a.author.fullName.toLowerCase().includes(q))
      );
    }

    if (tagFilter) {
      filtered = filtered.filter((a: Article) => a.tags && a.tags.includes(tagFilter));
    }

    if (authorFilter) {
      filtered = filtered.filter((a: Article) => a.author?.id === authorFilter);
    }

    setArticles(filtered);
  }, [initialArticles, search, tagFilter, authorFilter]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Статьи</h1>
        <Link href="/admin/articles/new">
          <Button className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Новая статья
          </Button>
        </Link>
      </div>

      {/* Фильтры */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-gray-300 px-4 py-2"
          placeholder="Поиск по названию, автору, тэгу..."
        />

        <select
          value={tagFilter}
          onChange={e => setTagFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 min-w-[150px]"
        >
          <option value="">Все тэги</option>
          {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
        </select>

        <select
          value={authorFilter}
          onChange={e => setAuthorFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 min-w-[180px]"
        >
          <option value="">Все авторы</option>
          {allAuthors.map((a: any) => (
            <option key={a.id} value={a.id}>{a.fullName}</option>
          ))}
        </select>

        <Button
          variant="ghost"
          onClick={() => {
            setSearch("");
            setTagFilter("");
            setAuthorFilter("");
          }}
        >
          Сбросить фильтры
        </Button>
      </div>

      {/* Счётчик */}
      <div className="text-sm text-gray-500">
        Найдено статей: {articles.length}
      </div>

      {/* Таблица */}
      <ArticlesTable articles={articles} />
    </div>
  );
}