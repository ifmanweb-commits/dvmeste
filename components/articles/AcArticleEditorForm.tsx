// components/articles/AcArticleEditorForm.tsx
"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Save, Send, MessageSquare, Image as ImageIcon, X, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { ArticleTagsSelector } from "./AcArticleTagsSelector";
import { saveArticleAction } from "@/app/account/articles/actions";
import { useRouter } from "next/navigation";
import AcImageManager from "./AcImageManager"; // ← новый импорт

const AcTiptapEditor = dynamic(() => import("@/components/articles/AcTiptapEditor"), { 
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-slate-50 animate-pulse rounded-xl border border-slate-100" />
});

interface AcArticleEditorFormProps {
  initialData: any;
  availableTags: string[];
}

export default function AcArticleEditorForm({ initialData, availableTags }: AcArticleEditorFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isFilesOpen, setIsFilesOpen] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Состояния полей
  const [title, setTitle] = useState(initialData.title || "");
  const [content, setContent] = useState(initialData.content || "");
  const [tags, setTags] = useState<string[]>(initialData.tags || []);
  const [editorInstance, setEditorInstance] = useState<any>(null);

  // Режим "Только чтение", если статья на проверке
  const isReadOnly = initialData.moderationStatus === 'PENDING';
  const showDraftButton = !isReadOnly && initialData.moderationStatus !== 'REVISION';
  // Определяем текст кнопки отправки
  const getSubmitButtonText = () => {
    if (initialData.moderationStatus === 'REVISION') return "Отправить на повторную проверку";
    return "Отправить на модерацию";
  };

  const insertImage = (url: string) => {
    if (editorInstance) {
      editorInstance.chain().focus().setImage({ src: url }).run();
      // Шторка НЕ закрывается, чтобы можно было вставить несколько
    }
  };

  const handleSave = async (isPublishing: boolean) => {
    setIsSaving(true);
    
    const result = await saveArticleAction(initialData.id, {
      title,
      content,
      tags,
      isPublished: false,
      moderationStatus: isPublishing ? "PENDING" : undefined,
      submittedAt: isPublishing ? new Date() : undefined,
    });

    setIsSaving(false);

    if (result.success) {
      if (isPublishing) {
        // После отправки на модерацию — редирект на список статей
        router.push("/account/articles");
      } else {
        router.refresh();
        setSaveMessage({ 
          text: "Изменения сохранены", 
          type: 'success' 
        });
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } else {
      setSaveMessage({ text: result.error || "Ошибка при сохранении", type: 'error' });
    }
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    await handleSave(true);
    setIsSubmitting(false);
    setShowConfirmModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Статус-бар для правок (REVISION) */}
      {initialData.moderationStatus === 'REVISION' && initialData.moderatorComment && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
          <MessageSquare className="text-amber-600 shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm font-semibold text-amber-800">Нужны правки</p>
            <p className="text-sm text-amber-700 italic mt-1">"{initialData.moderatorComment}"</p>
          </div>
        </div>
      )}

      {/* Секция: Название статьи */}
      <section>
        <label className="text-sm font-semibold text-gray-900 block mb-2">Название статьи</label>
        <input
          type="text"
          value={title}
          disabled={isReadOnly}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base text-gray-900 placeholder:text-gray-400 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20 outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
          placeholder="Введите название статьи"
        />
      </section>

      {/* Секция: Теги */}
      <section>
        <label className="text-sm font-semibold text-gray-900 block mb-2">Тематические теги</label>
        <ArticleTagsSelector
          availableTags={availableTags}
          value={tags}
          onChange={setTags}
          disabled={isReadOnly}
          label=""
        />
      </section>

      {/* Секция: Содержание */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-gray-900">Содержание</label>
          <button
            type="button"
            onClick={() => setIsFilesOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <ImageIcon size={14} /> Изображения
          </button>
        </div>
        <AcTiptapEditor
          content={content}
          onChange={setContent}
          onReady={setEditorInstance}
          readOnly={isReadOnly}
        />
      </section>

      {/* Кнопки управления */}
      {!isReadOnly && (
        <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-gray-200 items-center">
          <div className="flex-1 flex gap-4 w-full">
            {showDraftButton && (
              <button
                onClick={() => handleSave(false)}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                <Save size={16} /> 
                {isSaving ? "Сохранение..." : "Сохранить черновик"}
              </button>
            )}
            
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={isSaving}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 ${
                showDraftButton ? 'bg-[#5858E2]' : 'bg-[#5858E2] w-full'
              } text-white rounded-lg font-medium hover:bg-[#4a4ac9] transition-all disabled:opacity-50`}
            >
              <Send size={16} /> 
              {getSubmitButtonText()}
            </button>
          </div>
          
          {/* Сообщение о сохранении */}
          {saveMessage && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
              saveMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-700' 
                : 'bg-red-50 text-red-700'
            }`}>
              {saveMessage.type === 'success' && <CheckCircle size={14} />}
              {saveMessage.text}
            </div>
          )}
        </div>
      )}

{/* Шторка с AcImageManager */}
      {isFilesOpen && (
        <div className="fixed inset-y-0 right-0 w-[400px] bg-white shadow-2xl z-[100] border-l border-slate-200 flex flex-col">
          {/* Заголовок шторки */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <h2 className="text-sm font-semibold tracking-wide">
              Изображения
            </h2>
            <button 
              onClick={() => setIsFilesOpen(false)} 
              className="text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Контент */}
          <div className="flex-1 overflow-hidden p-6">
            <AcImageManager 
              articleId={initialData.id}
              onFileSelect={insertImage}
            />
          </div>
        </div>
      )}

      {/* Модалка подтверждения отправки на модерацию */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[150]">
          <div className="bg-white rounded-2xl max-w-md w-full mx-4 shadow-2xl overflow-hidden">
            {/* Заголовок с иконкой */}
            <div className="bg-amber-50 px-6 py-4 flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-full">
                <AlertCircle size={24} className="text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-amber-900">
                Отправка на модерацию
              </h3>
            </div>
            
            {/* Контент */}
            <div className="px-6 py-5">
              <p className="text-slate-700 leading-relaxed mb-4">
                После отправки на модерацию статья станет недоступной для редактирования.
              </p>
              <p className="text-slate-700 leading-relaxed mb-4">
                Модератор проверит материал и либо:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-1 mb-4 ml-2">
                <li>Примет статью как есть</li>
                <li>Вернёт на доработку с комментариями</li>
              </ul>
              <p className="text-slate-700 leading-relaxed font-medium">
                Убедитесь, что вы внесли все изменения, которые хотели.
              </p>
            </div>
            
            {/* Кнопки */}
            <div className="px-6 py-4 bg-slate-50 flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-semibold hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>Отправка...</>
                ) : (
                  <>Подтвердить отправку</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
