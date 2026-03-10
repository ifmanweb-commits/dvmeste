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
    <div className="min-h-screen bg-[#fafafa]">
      <div className="max-w-5xl mx-auto py-10 px-6">
        
        {/* Хедер с навигацией */}
        <header className="mb-10">
          <Link 
            href="/account/articles" 
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-blue-600 transition-colors mb-4"
          >
            <ChevronLeft size={14} /> Назад к списку
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 mb-1">
                Личный кабинет / Редактор
              </h1>
              <p className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                {article.title ? "Правка публикации" : "Подготовка новой статьи"}
              </p>
            </div>
            
            <div className="text-left md:text-right border-l md:border-l-0 md:border-r border-slate-200 pl-4 md:pl-0 md:pr-4">
              <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">ID Документа</span>
              <span className="text-xs font-mono font-bold text-slate-500">{article.id}</span>
            </div>
          </div>
        </header>

        {/* Основная форма */}
        <div className="bg-white border border-slate-200 p-8 md:p-12 shadow-sm">
          <AcArticleEditorForm 
            initialData={formattedArticle} 
            availableTags={availableTags} 
          />
        </div>

      </div>
    </div>
  );
}