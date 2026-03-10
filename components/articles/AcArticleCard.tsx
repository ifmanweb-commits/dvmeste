// components/articles/ArticleCard.tsx
import { Edit3, Trash2, Calendar, AlertCircle, CheckCircle2, Clock } from "lucide-react";

interface ArticleCardProps {
  article: {
    id: string;
    title: string;
    moderationStatus: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REVISION';
    updatedAt: string;
    moderatorComment?: string | null;
    creditedMonth?: number | null;
    creditedYear?: number | null;
  };
}

export default function ArticleCard({ article }: ArticleCardProps) {
  // Мапа для стилей статусов
  const statusConfig = {
    DRAFT: { label: 'Черновик', color: 'bg-slate-100 text-slate-600', icon: <Edit3 className="w-3 h-3" /> },
    PENDING: { label: 'На проверке', color: 'bg-amber-100 text-amber-700', icon: <Clock className="w-3 h-3" /> },
    REVISION: { label: 'Нужны правки', color: 'bg-rose-100 text-rose-700', icon: <AlertCircle className="w-3 h-3" /> },
    APPROVED: { label: 'Одобрено', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 className="w-3 h-3" /> },
  };

  const config = statusConfig[article.moderationStatus];

  return (
    <div className={`group relative bg-white border rounded-2xl p-6 transition-all hover:shadow-md ${article.moderationStatus === 'REVISION' ? 'border-rose-200' : 'border-slate-200'}`}>
      
      {/* Шапка карточки */}
      <div className="flex justify-between items-start mb-4">
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${config.color}`}>
          {config.icon}
          {config.label}
        </div>
        <span className="text-xs text-slate-400 font-medium">
          Обновлено: {new Date(article.updatedAt).toLocaleDateString()}
        </span>
      </div>

      {/* Заголовок */}
      <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
        {article.title || "Без названия"}
      </h3>

      {/* Блок для Одобренной статьи (Биллинг) */}
      {article.moderationStatus === 'APPROVED' && article.creditedMonth && (
        <div className="flex items-center gap-2 mb-4 text-emerald-700 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/50">
          <Calendar className="w-4 h-4" />
          <span className="text-sm font-semibold">
            Зачтено за: {new Intl.DateTimeFormat('ru', { month: 'long', year: 'numeric' }).format(new Date(article.creditedYear!, article.creditedMonth! - 1))}
          </span>
        </div>
      )}

      {/* Блок комментария модератора (REVISION) */}
      {article.moderationStatus === 'REVISION' && article.moderatorComment && (
        <div className="mb-5 p-4 bg-rose-50 rounded-xl border-l-4 border-rose-400">
          <p className="text-xs font-bold text-rose-800 uppercase mb-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Комментарий модератора
          </p>
          <p className="text-sm text-rose-700 italic leading-relaxed">
            «{article.moderatorComment}»
          </p>
        </div>
      )}

      {/* Футер с кнопками */}
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
        <div className="flex gap-2 w-full">
          <button 
            disabled={article.moderationStatus === 'PENDING'}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 transition-all"
          >
            <Edit3 className="w-4 h-4" />
            {article.moderationStatus === 'REVISION' ? 'Исправить' : 'Редактировать'}
          </button>
          
          <button className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}