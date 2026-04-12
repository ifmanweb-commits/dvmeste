"use client";

import { useRef, useEffect, type MutableRefObject } from "react";

export type AdminArticleEditorApi = {
  insertHtml: (snippet: string) => boolean;
  focus: () => void;
  getHtml: () => string;
};

interface AdminArticleEditorProps {
  content: string;
  onChange: (html: string) => void;
  onReady: (api: AdminArticleEditorApi | null) => void;
  readOnly?: boolean;
}

export default function AdminArticleEditor({
  content,
  onChange,
  onReady,
  readOnly = false,
}: AdminArticleEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const onChangeRef = useRef(onChange);
  const contentRef = useRef(content);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Экспортируем API для интеграции с FileManager
  useEffect(() => {
    const api: AdminArticleEditorApi = {
      insertHtml: (snippet: string): boolean => {
        if (!snippet) return false;

        const textarea = textareaRef.current;
        if (!textarea) return false;

        const currentValue = contentRef.current || "";
        const start = textarea.selectionStart ?? currentValue.length;
        const end = textarea.selectionEnd ?? currentValue.length;
        const nextValue = `${currentValue.slice(0, start)}${snippet}${currentValue.slice(end)}`;
        const caret = start + snippet.length;

        onChangeRef.current(nextValue);

        window.setTimeout(() => {
          const node = textareaRef.current;
          if (!node) return;
          node.focus();
          node.setSelectionRange(caret, caret);
        }, 0);

        return true;
      },
      focus: () => {
        textareaRef.current?.focus();
      },
      getHtml: () => {
        return contentRef.current || "";
      },
    };

    onReady(api);

    return () => {
      onReady(null);
    };
  }, [onReady]);

  return (
    <div>
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Контент статьи (HTML)
          <span className="text-xs text-gray-500 ml-2">
            — редактирование в режиме HTML
          </span>
        </label>
      </div>

      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        disabled={readOnly}
        rows={30}
        className="w-full min-h-[600px] font-mono text-sm bg-white text-slate-900 px-4 py-3 rounded-lg border border-gray-300 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20 focus:outline-none"
        spellCheck={false}
        placeholder="Введите HTML контент статьи..."
      />

      <p className="text-xs text-gray-500 mt-2">
        💡 Поддерживается любой валидный HTML. Для вставки файлов используйте кнопку "Вставить в текст" в менеджере файлов.
      </p>
    </div>
  );
}