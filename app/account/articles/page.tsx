// app/account/articles/page.tsx
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import ArticlesStats from "@/components/articles/AcArticlesStats";
import ArticleTable from "@/components/articles/AcArticleTable";
import AcApprovedArticles from "@/components/articles/AcArticlesApproved";
import { Lock } from "lucide-react";
import "./editor.css";

export default async function MyArticlesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Проверка: только ACTIVE пользователи могут управлять статьями
  if (user.status === "CANDIDATE") {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Мои статьи</h1>
            <p className="text-gray-600">Управляйте своими статьями</p>
          </header>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 text-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <Lock className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Статьи недоступны</h3>
              <p className="text-sm text-gray-500 max-w-md mt-2">
                Заявки от клиентов на консультацию могут принимать только проверенные психологи, размещенные в каталоге. Получите сертификат о первом уровне квалификации и выше, чтобы открыть этот раздел.
              </p>
              <a 
                href="/account/certification"
                className="mt-6 text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer inline-block"
              >
                К сертификации →
              </a>
            </div>
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
      bonusPoints: true,
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

  // Получаем общую сумму бонусов пользователя
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: { totalBonus: true }
  });

  // Разделяем статьи для разных секций
  const approvedArticles = formattedArticles.filter(a => a.moderationStatus === "APPROVED");
  const workArticles = formattedArticles.filter(a => a.moderationStatus !== "APPROVED");
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Мои статьи
          </h1>
        </header>

        {/* Плашка-предупреждение для мобильных */}
        <div className="sm:hidden bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-amber-800">
            📱 С мобильного телефона функционал написания и правки статей недоступен, зайдите с компьютера
          </p>
        </div>

        <ArticlesStats 
          totalBonus={userData?.totalBonus ?? 0}
          draftCount={draftCount} 
        />

        {workArticles.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Статьи в работе
            </h2>
            <ArticleTable articles={workArticles} />
          </section>
        )}

        <AcApprovedArticles articles={approvedArticles} />
      </div>
    </div>
  );
}