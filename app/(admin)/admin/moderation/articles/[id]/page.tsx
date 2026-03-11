"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ArrowLeft, Check, MessageSquare } from "lucide-react";
import { getModerationArticle, approveArticle, revisionArticle } from "../actions";
import AcTiptapEditor from "@/components/articles/AcTiptapEditor"; // ← импорт редактора
import "@/app/account/articles/editor.css"

export default function ModerationArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const router = useRouter();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisionComment, setRevisionComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [editor, setEditor] = useState<any>(null);

  useEffect(() => {
    loadArticle();
  }, [id]);

  async function loadArticle() {
    setLoading(true);
    const result = await getModerationArticle(id);
    if (result.success) {
      setArticle(result.article);
      // После получения статьи, редактор автоматически сконвертирует Markdown в HTML
    } else {
      setError(result.error || "Ошибка загрузки");
    }
    setLoading(false);
  }

  // Когда редактор готов и есть статья, получаем HTML
  useEffect(() => {
    if (editor && article) {
      // Устанавливаем контент в редактор
      editor.commands.setContent(article.content);
      // Получаем HTML
      const html = editor.getHTML();
      setHtmlContent(html);
    }
  }, [editor, article]);

  // Принимаем статью — используем HTML из состояния
  async function handleApprove() {
    if (!confirm("Принять статью?")) return;
    
    setSubmitting(true);
    // Передаём HTML, который уже есть в состоянии
    const result = await approveArticle(id, htmlContent); 
    setSubmitting(false);
    
    if (result.success) {
      router.push("/admin/moderation/articles");
      router.refresh();
    } else {
      alert(result.error || "Ошибка при принятии");
    }
  }

  async function handleRevision() {
    if (!revisionComment.trim()) {
      alert("Укажите, что нужно исправить");
      return;
    }
    
    setSubmitting(true);
    const result = await revisionArticle(id, revisionComment);
    setSubmitting(false);
    
    if (result.success) {
      router.push("/admin/moderation/articles");
      router.refresh();
    } else {
      alert(result.error || "Ошибка при отправке на доработку");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <div className="text-center py-12">Загрузка...</div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error || "Статья не найдена"}
        </div>
        <Link
          href="/admin/moderation/articles"
          className="inline-flex items-center gap-2 text-[#5858E2] hover:text-[#4848d0] mt-4"
        >
          <ArrowLeft size={16} /> Вернуться к списку
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      {/* Скрытый редактор для конвертации */}
      <div className="hidden">
        <AcTiptapEditor
          content={article.content || ""}
          onChange={() => {}} // ничего не делаем
          onReady={setEditor}
          readOnly={true}
        />
      </div>

      {/* Навигация */}
      <Link
        href="/admin/moderation/articles"
        className="inline-flex items-center gap-2 text-[#5858E2] hover:text-[#4848d0] mb-6"
      >
        <ArrowLeft size={16} /> К списку статей
      </Link>

      {/* Шапка */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {article.title || "Без названия"}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>
                Автор:{" "}
                <Link
                  href={`/admin/psychologists/${article.user?.id}`}
                  className="text-[#5858E2] hover:underline"
                >
                  {article.user?.fullName || "Не указан"}
                </Link>
              </span>
              <span>•</span>
              <span>
                Отправлено:{" "}
                {article.submittedAt
                  ? format(new Date(article.submittedAt), "dd MMM yyyy, HH:mm", { locale: ru })
                  : "неизвестно"}
              </span>
            </div>
          </div>
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
            Ожидает модерации
          </span>
        </div>

        {/* Теги (read-only) */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-sm font-medium text-gray-700 mb-2">Теги:</div>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Контент статьи */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Содержание статьи</h2>
        <div 
          className="prose max-w-none tiptap-editor"
          dangerouslySetInnerHTML={{ __html: htmlContent || article.content }}
        />
      </div>

      {/* Блок действий */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {!showRevisionForm ? (
          <div className="flex gap-4">
            <button
              onClick={handleApprove}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
            >
              <Check size={20} />
              Принять
            </button>
            <button
              onClick={() => setShowRevisionForm(true)}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 font-medium"
            >
              <MessageSquare size={20} />
              На доработку
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Комментарий для автора
              </label>
              <textarea
                value={revisionComment}
                onChange={(e) => setRevisionComment(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
                placeholder="Укажите, что нужно исправить..."
                disabled={submitting}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRevision}
                disabled={submitting || !revisionComment.trim()}
                className="flex-1 px-6 py-3 bg-[#5858E2] text-white rounded-lg hover:bg-[#4848d0] transition-colors disabled:opacity-50 font-medium"
              >
                Отправить на доработку
              </button>
              <button
                onClick={() => {
                  setShowRevisionForm(false);
                  setRevisionComment("");
                }}
                disabled={submitting}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}