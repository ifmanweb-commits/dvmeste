// app/account/articles/page.tsx
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import ArticlesStats from "@/components/articles/AcArticlesStats";
import ArticleTable from "@/components/articles/AcArticleTable";
import ApprovedArticles from "@/components/articles/AcArticlesApproved";
import "./editor.css";

export default async function MyArticlesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Получаем все статьи пользователя
  const articles = await prisma.article.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      moderationStatus: true,
      updatedAt: true,
      moderatorComment: true,
      creditedMonth: true,
      creditedYear: true,
      slug: true,
    }
  });
  //console.log('Any articles count:', articles.length);
  const formattedArticles = articles.map(article => ({
    ...article,
    updatedAt: article.updatedAt.toISOString(), // Date → string
    creditedMonth: article.creditedMonth ?? undefined, // null → undefined
    creditedYear: article.creditedYear ?? undefined, // null → undefined
    moderatorComment: article.moderatorComment ?? undefined, // null → undefined
  }));
  /*console.log('Статусы статей:', formattedArticles.map(a => ({ 
    id: a.id, 
    status: a.moderationStatus,
    title: a.title 
  })));*/

  // Считаем черновики
  const draftCount = formattedArticles.filter(a => a.moderationStatus === "DRAFT").length;

  // Находим последнюю принятую статью для биллинга
  const lastApproved = formattedArticles
    .filter(a => a.moderationStatus === "APPROVED" && a.creditedMonth && a.creditedYear)
    .sort((a, b) => {
      const dateA = new Date(a.creditedYear!, a.creditedMonth! - 1);
      const dateB = new Date(b.creditedYear!, b.creditedMonth! - 1);
      return dateB.getTime() - dateA.getTime();
    })[0];

  // Разделяем статьи для разных секций
  const approvedArticles = formattedArticles.filter(a => a.moderationStatus === "APPROVED");
  const workArticles = formattedArticles.filter(a => a.moderationStatus !== "APPROVED");
  return (
    <div className="min-h-screen bg-slate-50/20">
      <div className="max-w-6xl mx-auto py-12 px-6">
        <header className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900">
            Мои статьи
          </h1>
        </header>

        <ArticlesStats 
          lastCreditedMonth={lastApproved?.creditedMonth}
          lastCreditedYear={lastApproved?.creditedYear} 
          draftCount={draftCount} 
        />

        <div className="mt-16">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-6 pl-1">
            Статьи в работе
          </h2>
          <ArticleTable articles={workArticles} />
        </div>

        <ApprovedArticles articles={approvedArticles as any} />
      </div>
    </div>
  );
}