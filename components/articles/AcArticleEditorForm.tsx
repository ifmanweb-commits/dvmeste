// components/articles/AcArticleEditorForm.tsx
"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Save, Send, MessageSquare, Image as ImageIcon, X, CheckCircle } from "lucide-react";
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
  
  // Состояния полей
  const [title, setTitle] = useState(initialData.title || "");
  const [content, setContent] = useState(initialData.content || "");
  const [tags, setTags] = useState<string[]>(initialData.tags || []);
  const [editorInstance, setEditorInstance] = useState<any>(null);

  // Режим "Только чтение", если статья на проверке
  const isReadOnly = initialData.status === 'PENDING';

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
      isPublished: isPublishing,
    });

    setIsSaving(false);

    if (result.success) {
      router.refresh();
      setSaveMessage({ 
        text: isPublishing ? "Статья отправлена на модерацию" : "Изменения сохранены", 
        type: 'success' 
      });
      setTimeout(() => setSaveMessage(null), 3000);
    } else {
      setSaveMessage({ text: result.error || "Ошибка при сохранении", type: 'error' });
    }
  };

  return (
    <div className="space-y-8">
      {/* Статус-бар для правок (REVISION) */}
      {initialData.moderationStatus === 'REVISION' && initialData.moderatorComment && (
        <div className="p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-xl flex gap-3">
          <MessageSquare className="text-amber-600 shrink-0" size={20} />
          <div>
            <p className="text-xs font-black uppercase text-amber-700 tracking-wider">Нужны правки</p>
            <p className="text-sm text-amber-800 italic">"{initialData.moderatorComment}"</p>
          </div>
        </div>
      )}

      {/* Заголовок */}
      <section>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Название статьи</label>
        <input
          type="text"
          value={title}
          disabled={isReadOnly}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Например: Как справиться с тревогой в мегаполисе"
          className="w-full text-3xl font-black text-slate-900 border-none outline-none placeholder:text-slate-200 bg-transparent"
        />
      </section>

      {/* Теги */}
      <section className="max-w-md">
        <ArticleTagsSelector
          availableTags={availableTags}
          value={tags}
          onChange={setTags}
          disabled={isReadOnly}
          label="Тематические теги"
        />
      </section>

      {/* Редактор */}
      <section>
        <div className="flex justify-end mb-2">
          <button
            type="button"
            onClick={() => setIsFilesOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase hover:bg-slate-200 transition-colors"
          >
            <ImageIcon size={14} /> Управление изображениями
          </button>
        </div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Содержание</label>
        <AcTiptapEditor
          content={content}
          onChange={setContent}
          onReady={setEditorInstance}
          readOnly={isReadOnly}
        />
      </section>

      {/* Кнопки управления */}
      {!isReadOnly && (
        <div className="flex flex-col md:flex-row gap-4 pt-8 border-t border-slate-100 items-center">
          <div className="flex-1 flex gap-4">
            <button
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold uppercase text-[11px] tracking-widest hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              <Save size={18} /> 
              {isSaving ? "Сохранение..." : "Сохранить черновик"}
            </button>
            
            <button
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-xl font-bold uppercase text-[11px] tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
            >
              <Send size={18} /> 
              Отправить на модерацию
            </button>
          </div>
          
          {/* Сообщение о сохранении */}
          {saveMessage && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
              saveMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {saveMessage.type === 'success' && <CheckCircle size={16} />}
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
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">
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
    </div>
  );
}