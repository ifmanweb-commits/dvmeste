"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import ArticleForm from "@/components/articles/ArticleForm";
import { getPsychologists } from "@/lib/actions/psychologists";
import { Eye, Trash2, Check } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

                                             
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
      
      // Принудительно обновляем данные на сервере и клиенте
      router.refresh();
      router.push(`/admin/articles?updated=${Date.now()}`);
    } catch (error) {
      console.error("Error updating article:", error);
      throw error;
    }
  }

  function openDeleteModal() {
    setIsDeleteModalOpen(true);
  }

  function closeDeleteModal() {
    if (!isDeleting) {
      setIsDeleteModalOpen(false);
    }
  }

  async function confirmDelete() {
    setIsDeleting(true);
    
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
        setIsDeleting(false);
        setIsDeleteModalOpen(false);
      }
    } catch (error) {
      console.error("Error deleting article:", error);
      alert("Ошибка при удалении");
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
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
/*console.log('AdminArticleEditPage - article data:', {
  id: article.id,
  authorId: article.authorId,
  author: article.author,
  authorFullName: article.author?.fullName
});*/
  return (
      <div className="mx-auto w-full max-w-6xl px-4 py-0 sm:px-0 lg:px-0">
          <CardContent>
            <div className="mb-4 flex gap-4 pt-2 pb-2 sticky top-22 bg-white z-100 border-b">
              <div className="flex items-center gap-4">
                {article.publishedAt ? (
                    <Badge variant="primary"><Check size="20" className="mr-1"/> Опубликовано</Badge>
                ) : (
                    <Badge variant="neutral">Черновик</Badge>
                )}
                <div className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                  ID: {article.id}
                </div>
              </div>
              <div className="flex gap-2 ml-auto">
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(`/articles/${article.slug}`, "_blank")}
                    className="cursor-pointer"
                >
                  <Eye size="20" className="mr-1"/> Просмотр
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openDeleteModal}
                  className="cursor-pointer bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300 hover:text-red-800"
                >
                  <Trash2 size="20" className="mr-1"/> Удалить
                </Button>
              </div>
            </div>
            
            <ArticleForm
                initialData={article}
                onSubmit={handleSubmit}
                psychologists={psychologists}
            />

            <ConfirmationModal
              isOpen={isDeleteModalOpen}
              onClose={closeDeleteModal}
              onConfirm={confirmDelete}
              title="Удаление статьи"
              message="Вы действительно хотите безвозвратно удалить статью?"
              confirmText="Удалить"
              cancelText="Отмена"
              isDestructive={true}
              isLoading={isDeleting}
            />
          </CardContent>
      </div>
  );
}
