// app/account/articles/page.tsx
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import ArticlesStats from "@/components/articles/AcArticlesStats";
import ArticleTable from "@/components/articles/AcArticleTable";
import AcApprovedArticles from "@/components/articles/AcArticlesApproved";
import "./editor.css";

export default async function MyArticlesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Проверка: только ACTIVE пользователи могут управлять статьями
  if (user.status === "CANDIDATE") {
    return (
      <div className="min-h-screen bg-slate-50/20">
        <div className="max-w-2xl mx-auto py-12 px-6">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-3">
              Доступ ограничен
            </h1>
            <p className="text-gray-600 leading-relaxed">
              Только проверенные психологи, участники каталога могут управлять статьями. 
              Подтвердите квалификацию и раздел будет для вас открыт.
            </p>
          </div>
        </div>
      </div>
    );
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
      slug: true,
    }
  });
  //console.log('Any articles count:', articles.length);
  const formattedArticles = articles.map(article => ({
    ...article,
    updatedAt: article.updatedAt.toISOString(), // Date → string
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
  /*const lastApproved = formattedArticles
    .filter(a => a.moderationStatus === "APPROVED" && a.creditedMonth && a.creditedYear)
    .sort((a, b) => {
      const dateA = new Date(a.creditedYear!, a.creditedMonth! - 1);
      const dateB = new Date(b.creditedYear!, b.creditedMonth! - 1);
      return dateB.getTime() - dateA.getTime();
    })[0];*/
  // Вместо фильтрации статей
  const lastCredit = await prisma.articleCredit.findFirst({
    where: { userId: user.id },
    orderBy: [{ year: 'desc' }, { month: 'desc' }]
  });
  const credits = await prisma.articleCredit.findMany({
    where: { userId: user.id },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
    include: {
      article: {
        select: { slug: true }
      }
    }
  });

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
          lastCreditedMonth={lastCredit?.month}
          lastCreditedYear={lastCredit?.year} 
          draftCount={draftCount} 
        />

        {workArticles.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-6 pl-1">
              Статьи в работе
            </h2>
            <ArticleTable articles={workArticles} />
          </div>
        )}

        <AcApprovedArticles credits={credits as any}/>
      </div>
    </div>
  );
}