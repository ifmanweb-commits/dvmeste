"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import ArticleForm from "@/components/articles/ArticleForm";
import { getPsychologists } from "@/lib/actions/psychologists";
import { Eye, Trash2 } from 'lucide-react';

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

  // Функция форматирования HTML - добавляет перенос строки после закрывающих тегов
  const formatHtml = (html: string): string => {
    if (!html) return html;
    // Добавляем перенос строки после закрывающего тега, если его там нет
    return html.replace(/(<\/[^>]+>)(?!\n)/g, '$1\n');
  };

  useEffect(() => {
    setLoading(true);
    fetch(`/api/articles/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            // Форматируем HTML контента для удобства чтения
            const formattedArticle = {
              ...data.article,
              content: formatHtml(data.article.content)
            };
            setArticle(formattedArticle);
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
      <div className="">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Загрузка...</h1>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-red-500">{error || "Статья не найдена"}</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      {/* Заголовок страницы */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{article.title || "Без названия"}</h1>
        <p className="text-gray-500 mt-1">Редактирование статьи</p>
        
        {/* Кнопки действий */}
        <div className="flex gap-3 mt-4">
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
    </div>
  );
}