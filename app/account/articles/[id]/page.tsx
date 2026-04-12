import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import AcArticleEditorForm from "@/components/articles/AcArticleEditorForm";
import "../editor.css";

export default async function EditArticlePage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Проверка: только ACTIVE пользователи могут управлять статьями
  if (user.status === "CANDIDATE") {
    redirect("/account/articles");
  }

  // 1. Получаем статью
  const article = await prisma.article.findFirst({
      where: { 
        id: id,
        userId: user.id // ← важно: только свои статьи
      },
      include: {
        articleImages: true
      }
  });

  if (!article) {
    notFound();
  }

  // Получаем теги из DataList
  const tagsData = await prisma.dataList.findUnique({
    where: { slug: "article-tags" },
    select: { items: true }
  });

  let availableTags: string[] = [];
  if (tagsData?.items && Array.isArray(tagsData.items)) {
    availableTags = tagsData.items as string[];
  }


  // 3. Преобразуем даты для передачи в клиентский компонент
  const formattedArticle = {
    ...article,
    updatedAt: article.updatedAt.toISOString(),
    createdAt: article.createdAt.toISOString(),
    publishedAt: article.publishedAt?.toISOString() || null,
    moderatedAt: article.moderatedAt?.toISOString() || null,
    submittedAt: article.submittedAt?.toISOString() || null,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Заголовок страницы */}
        <header className="mb-8">
          <Link
            href="/account/articles"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#5858E2] hover:text-[#4a4ac9] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Вернуться к списку
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
              {article.title ? "Редактирование статьи" : "Новая статья"}
            </h1>
            <p className="text-gray-600 mt-1">
              {article.title || "Создание новой статьи"}
            </p>
          </div>
        </header>

        {/* Основная форма */}
        <div className="rounded-xl bg-white shadow-sm p-6 md:p-8">
          <AcArticleEditorForm 
            initialData={formattedArticle} 
            availableTags={availableTags} 
          />
        </div>
      </div>
    </div>
  );
}