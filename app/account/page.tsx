// app/account/articles/page.tsx
import ArticlesStats from "@/components/articles/AcArticlesStats";
import ArticleCard from "@/components/articles/AcArticleCard";

export default function MyArticlesPage() {
  // Имитация данных из БД
  const mockArticles = [
    {
      id: "1",
      title: "Психосоматика: как эмоции влияют на тело",
      moderationStatus: "APPROVED" as const,
      updatedAt: "2026-03-05",
      creditedMonth: 4,
      creditedYear: 2026
    },
    {
      id: "2",
      title: "10 техник борьбы с тревожностью",
      moderationStatus: "REVISION" as const,
      updatedAt: "2026-03-09",
      moderatorComment: "Нужно добавить ссылки на исследования и структурировать список техник."
    },
    {
      id: "3",
      title: "Почему важно соблюдать личные границы",
      moderationStatus: "PENDING" as const,
      updatedAt: "2026-03-10"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50/30">
      <div className="max-w-6xl mx-auto py-12 px-4">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">
            Мои статьи
          </h1>
          <p className="text-slate-500">Управляйте вашими публикациями и отслеживайте статус биллинга.</p>
        </header>

        <ArticlesStats 
          lastCreditedMonth={4} 
          lastCreditedYear={2026} 
          draftCount={1} 
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockArticles.map(art => (
            <ArticleCard key={art.id} article={art} />
          ))}
        </div>
        
        {mockArticles.length === 0 && (
          <div className="text-center py-20 bg-white border-2 border-dashed rounded-3xl">
            <p className="text-slate-400 font-medium">У вас пока нет ни одной статьи.</p>
          </div>
        )}
      </div>
    </div>
  );
}