"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import ArticleForm from "@/components/articles/ArticleForm";
import { getPsychologists } from "@/lib/actions/psychologists";

interface Article {
  id: string;
  title: string;
  slug: string;
  shortText: string | null;
  content: string;
  tags: string[];
  catalogSlug: string | null;
  publishedAt: string | null;
  isPublished?: boolean;
  authorId?: string | null;
  author?: any;
}

export default function AdminArticleEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [psychologists, setPsychologists] = useState<any[]>([]);
  const [loadingPsychologists, setLoadingPsychologists] = useState(true);

                                             
  useEffect(() => {
    getPsychologists()
        .then(data => {
          setPsychologists(data || []);
        })
        .catch(err => console.error("Error loading psychologists:", err))
        .finally(() => setLoadingPsychologists(false));
  }, []);

                               
  useEffect(() => {
    setLoading(true);
    fetch(`/api/articles/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setArticle(data.article);
          } else {
            setError(data.error || "Failed to load article");
          }
        })
        .catch(err => {
          console.error("Error loading article:", err);
          setError(err.message);
        })
        .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(formData: any) {
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Ошибка при сохранении");
      }
    } catch (error) {
      console.error("Error updating article:", error);
      throw error;
    }
  }

  async function handleDelete() {
    if (!window.confirm("Удалить статью безвозвратно?")) return;

    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: "DELETE"
      });

      const data = await res.json();
      if (data.success) {
        router.push("/admin/articles");
        router.refresh();
      } else {
        alert(data.error || "Ошибка при удалении");
      }
    } catch (error) {
      console.error("Error deleting article:", error);
      alert("Ошибка при удалении");
    }
  }

  if (loading || loadingPsychologists) {
    return (
        <Card className="mx-auto mt-8 w-full max-w-6xl">
          <CardContent className="py-12 text-center text-lg text-neutral-400">
            Загрузка...
          </CardContent>
        </Card>
    );
  }

  if (error || !article) {
    return (
        <Card className="mx-auto mt-8 w-full max-w-6xl">
          <CardContent className="py-12 text-center text-lg text-red-500">
            {error || "Статья не найдена"}
          </CardContent>
        </Card>
    );
  }

  return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader className="flex items-center justify-between gap-2">
            <span className="font-semibold text-xl text-[#5858E2]">Редактировать статью</span>
            {article.publishedAt ? (
                <Badge variant="primary">Опубликовано</Badge>
            ) : (
                <Badge variant="neutral">Черновик</Badge>
            )}
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex gap-2">
              <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(`/lib/articles/${article.slug}`, "_blank")}
              >
                Просмотр
              </Button>
              <Button size="sm" variant="outline" onClick={handleDelete}>
                Удалить
              </Button>
            </div>
            <ArticleForm
                initialData={article}
                onSubmit={handleSubmit}
                psychologists={psychologists}
            />
          </CardContent>
        </Card>
      </div>
  );
}
