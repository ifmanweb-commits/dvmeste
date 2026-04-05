// components/articles/AcApprovedArticles.tsx
import { ExternalLink, Award } from "lucide-react";
import Link from "next/link";

interface ApprovedArticle {
  id: string;
  title: string;
  slug: string;
  bonusPoints?: number | null;
}

// Функция для получения цвета плашки в зависимости от баллов
function getBonusStyle(bonus: number): { bg: string; icon: string; text: string } {
  if (bonus === 0) {
    return { bg: "bg-slate-200", icon: "text-slate-500", text: "text-slate-700" };
  }
  if (bonus <= 3) {
    return { bg: "bg-emerald-300", icon: "text-white", text: "text-white" };
  }
  if (bonus <= 4) {
    return { bg: "bg-emerald-400", icon: "text-white", text: "text-white" };
  }
  if (bonus === 5) {
    return { bg: "bg-emerald-500", icon: "text-white", text: "text-white" };
  }
  // 6 баллов - максимально яркий
  return { bg: "bg-emerald-600", icon: "text-white", text: "text-white" };
}

// Склонение слова "балл"
function getBonusDeclension(bonus: number): string {
  if (bonus === 0) {
    return "баллов";
  }
  if (bonus === 1) {
    return "балл";
  }
  if (bonus >= 2 && bonus <= 4) {
    return "балла";
  }
  return "баллов";
}

// Проверка: есть ли баллы (для стиля)
function hasBonus(bonus: number): boolean {
  return bonus > 0;
}

export default function AcApprovedArticles({ articles }: { articles: ApprovedArticle[] }) {
  if (articles.length === 0) return null;

  return (
    <div className="mt-16">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-[1px] flex-1 bg-slate-200"></div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Принятые статьи</h2>
        <div className="h-[1px] flex-1 bg-slate-200"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => {
          const bonus = article.bonusPoints ?? 0;
          const style = getBonusStyle(bonus);
          const declension = getBonusDeclension(bonus);
          const isBonus = hasBonus(bonus);
          
          return (
            <div key={article.id} className="group bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col hover:border-blue-200 transition-all">
              {/* Цветовая плашка сверху */}
              <div className={`${style.bg} px-6 py-5 flex items-center gap-4 transition-colors`}>
                <Award size={32} strokeWidth={2.5} className={style.icon} />
                <div className={style.text}>
                  <span className="text-3xl font-bold">{isBonus ? '+' : ''}{bonus}</span>
                  <span className="text-lg font-medium ml-1 opacity-90">{declension}</span>
                </div>
              </div>
              
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-md font-bold text-slate-800 leading-snug mb-6 flex-1 line-clamp-3">
                  {article.title}
                </h3>

                <Link
                  href={`/articles/${article.slug}`}
                  target="_blank"
                  className="mt-auto inline-flex items-center justify-center gap-2 w-full py-3 border-2 border-slate-100 text-slate-600 rounded-md text-xs font-bold hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
                >
                  <ExternalLink size={14} /> Читать на сайте
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
