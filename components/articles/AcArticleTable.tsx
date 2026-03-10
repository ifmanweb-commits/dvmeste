// components/articles/AcArticleTable.tsx
"use client";

import Link from "next/link";
import { Edit3, Trash2, AlertCircle, Clock, FileText, X } from "lucide-react";
import { deleteArticleAction } from "@/lib/actions/article-delete";
import { useState } from "react";

interface Article {
  id: string;
  title: string;
  moderationStatus: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REVISION';
  updatedAt: string;
  moderatorComment?: string | null;
}

export default function AcArticleTable({ articles }: { articles: Article[] }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null); // ← для модалки

  const handleDelete = async () => {
    if (!confirmDelete) return;
    
    setDeletingId(confirmDelete.id);
    setConfirmDelete(null);
    
    const result = await deleteArticleAction(confirmDelete.id);
    setDeletingId(null);
    
    if (!result.success) {
      alert(result.error || "Ошибка при удалении");
    }
  };

  if (articles.length === 0) return null;

  return (
    <div className="w-full border-t border-slate-200 shadow-sm mb-12 relative">
      {/* Модалка подтверждения */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-slate-900">Удаление статьи</h3>
              <button 
                onClick={() => setConfirmDelete(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="text-slate-600 mb-6">
              Вы уверены, что хотите удалить статью <span className="font-semibold">«{confirmDelete.title || "Без названия"}»</span>?<br/>
              Это действие нельзя отменить.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                disabled={deletingId === confirmDelete.id}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deletingId === confirmDelete.id ? (
                  <>Удаление...</>
                ) : (
                  <>Удалить</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <table className="w-full text-left border-collapse bg-white">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] font-black tracking-widest">
            <th className="px-6 py-4">Статус / Дата</th>
            <th className="px-6 py-4">Название</th>
            <th className="px-6 py-4 text-right">Управление</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {articles.map((article) => (
            <tr key={article.id} className="group transition-colors hover:bg-slate-50/30">
              <td className="px-6 py-5 align-top w-[200px]">
                {article.moderationStatus === 'REVISION' && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-100 text-red-700 text-[10px] font-bold uppercase"><AlertCircle size={12}/> Нужны правки</span>
                )}
                {article.moderationStatus === 'DRAFT' && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 text-slate-500 text-[10px] font-bold uppercase"><FileText size={12}/> Черновик</span>
                )}
                {article.moderationStatus === 'PENDING' && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-100 text-amber-700 text-[10px] font-bold uppercase"><Clock size={12}/> На проверке</span>
                )}
                <div className="text-[11px] text-slate-400 mt-2 font-medium tracking-tighter">
                  Изменено: {new Date(article.updatedAt).toLocaleDateString('ru-RU')}
                </div>
              </td>

              <td className="px-6 py-5 align-top">
                <h3 className="text-[15px] font-bold text-slate-800 leading-tight">
                  {article.title || "Новая статья без заголовка"}
                </h3>
                {article.moderationStatus === 'REVISION' && article.moderatorComment && (
                  <div className="mt-2 text-xs text-red-600 bg-red-50/50 p-2.5 border-l-2 border-red-400 italic leading-relaxed">
                    Замечание: {article.moderatorComment}
                  </div>
                )}
                <p className="text-[11px] text-slate-400 mt-2 uppercase font-bold tracking-tight">
                  Доступ: {article.moderationStatus === 'PENDING' ? 'Только чтение' : 'Полный'}
                </p>
              </td>

              <td className="px-6 py-5 align-top text-right">
                {article.moderationStatus !== 'PENDING' && (
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/account/articles/${article.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 transition-colors"
                    >
                      <Edit3 size={14} /> Правка
                    </Link>
                    <button
                      onClick={() => setConfirmDelete({ id: article.id, title: article.title })}
                      disabled={deletingId === article.id}
                      className={`p-2 transition-colors cursor-pointer ${
                        deletingId === article.id
                          ? 'text-slate-300 animate-pulse'
                          : 'text-slate-300 hover:text-red-500'
                      }`}
                      title="Удалить"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}