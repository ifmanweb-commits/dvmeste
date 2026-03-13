// components/articles/AcApprovedArticles.tsx
import { ExternalLink, Award, Calendar } from "lucide-react";
import Link from "next/link";

interface ArticleCredit {
  id: string;
  articleId: string;
  articleTitle: string;
  month: number;
  year: number;
  article?: {
    slug: string;
  } | null;
}

export default function AcApprovedArticles({ credits }: { credits: ArticleCredit[] }) {
  if (credits.length === 0) return null;

  return (
    <div className="mt-16">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-[1px] flex-1 bg-slate-200"></div>
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Принятые статьи</h2>
        <div className="h-[1px] flex-1 bg-slate-200"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {credits.map((credit) => (
          <div key={credit.id} className="group bg-white border border-slate-200 p-6 flex flex-col hover:border-blue-200 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                <Award size={24} />
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1 flex items-center gap-1">
                   <Calendar size={10} /> Период зачета
                </span>
                <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                  {new Intl.DateTimeFormat('ru', { month: 'long', year: 'numeric' }).format(new Date(credit.year, credit.month - 1))}
                </span>
              </div>
            </div>

            <h3 className="text-md font-bold text-slate-800 leading-snug mb-6 flex-1 line-clamp-3">
              {credit.articleTitle}
            </h3>

            {credit.article?.slug ? (
              <Link
                href={`/articles/${credit.article.slug}`}
                target="_blank"
                className="mt-auto inline-flex items-center justify-center gap-2 w-full py-3 border-2 border-slate-100 text-slate-600 rounded-md text-xs font-bold hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
              >
                <ExternalLink size={14} /> Читать на сайте
              </Link>
            ) : (
              <div className="mt-auto w-full py-3 text-center text-xs text-slate-400 border-2 border-slate-100 rounded-md">
                Статья удалена
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}