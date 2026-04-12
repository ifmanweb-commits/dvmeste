"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Eye, Code } from "lucide-react";

export type AdminWysiwygEditorApi = {
  insertHtml: (snippet: string) => boolean;
  focus: () => void;
  getHtml: () => string;
};

interface AdminWysiwygEditorProps {
  content: string;
  onChange: (html: string) => void;
  onReady: (api: AdminWysiwygEditorApi | null) => void;
  readOnly?: boolean;
}

export default function AdminWysiwygEditor({
  content,
  onChange,
  onReady,
  readOnly = false,
}: AdminWysiwygEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  
  // contentRef хранит актуальный контент без перерисовки
  const contentRef = useRef(content);
  
  // htmlValue используется только для textarea в HTML режиме
  // Обновляется только при переключении режимов
  const [htmlValue, setHtmlValue] = useState("");
  
  const isInitialized = useRef(false);

  // Функция очистки HTML от всех \n для отображения в визуальном редакторе
  const cleanHtmlForEditor = useCallback((html: string): string => {
    // Удаляем все \n полностью
    return html.replace(/\n+/g, '');
  }, []);

  // Функция форматирования HTML для отображения в textarea (добавляет \n после закрывающих тегов)
  const formatHtmlForDisplay = useCallback((html: string): string => {
    return html
      .replace(/(<\/[^>]+>)/g, '$1\n')           // \n после закрывающих тегов </p>, </div> и т.д.
      .replace(/(<(?:br|hr|img|input|meta|link)[^>]*>)/gi, '$1\n')  // \n после одиночных тегов
      .replace(/\n\s*\n/g, '\n')                 // Убираем множественные \n
      .trim();
  }, []);

  // ExecCommand wrapper для кроссбраузерности
  const execCommand = useCallback((command: string, value: string = "") => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  // Проверка состояния выделения
  const queryCommandState = useCallback((command: string): boolean => {
    try {
      return document.queryCommandState(command);
    } catch {
      return false;
    }
  }, []);

  const queryCommandValue = useCallback((command: string): string => {
    try {
      return document.queryCommandValue(command) || "";
    } catch {
      return "";
    }
  }, []);

  // Обработчик изменения контента - НЕ вызывает перерисовку
  const handleContentChange = useCallback(() => {
    const html = editorRef.current?.innerHTML || "";
    contentRef.current = html;  // Обновляем ref без перерисовки
    onChange(html);  // Родитель получает обновление
  }, [onChange]);

  // Инициализация при первой загрузке
  useEffect(() => {
    if (!isInitialized.current && editorRef.current && !isHtmlMode) {
      editorRef.current.innerHTML = cleanHtmlForEditor(content);
      contentRef.current = content;  // Сохраняем оригинальный контент
      isInitialized.current = true;
    }
  }, [content, isHtmlMode, cleanHtmlForEditor]);

  // Инициализация API
  useEffect(() => {
    const api: AdminWysiwygEditorApi = {
      insertHtml: (snippet: string): boolean => {
        if (!snippet) return false;

        if (isHtmlMode && textareaRef.current) {
          const textarea = textareaRef.current;
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const value = textarea.value;
          const newValue = value.slice(0, start) + snippet + value.slice(end);
          
          contentRef.current = newValue;
          setHtmlValue(newValue);
          onChange(newValue);
          
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + snippet.length, start + snippet.length);
          }, 0);
          
          return true;
        }

        // Визуальный режим - вставляем HTML в позицию курсора
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createRange().createContextualFragment(snippet));
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
          handleContentChange();
          return true;
        }
        
        return false;
      },
      focus: () => {
        if (isHtmlMode) {
          textareaRef.current?.focus();
        } else {
          editorRef.current?.focus();
        }
      },
      getHtml: () => {
        return isHtmlMode ? textareaRef.current?.value || "" : editorRef.current?.innerHTML || "";
      },
    };

    onReady(api);
  }, [onReady, isHtmlMode, handleContentChange, onChange]);

  // Синхронизация при переключении в HTML режим
  const handleSwitchToHtml = () => {
    const html = editorRef.current?.innerHTML || contentRef.current;
    contentRef.current = html;  // Сохраняем "сырой" HTML
    setHtmlValue(formatHtmlForDisplay(html));  // Форматируем для красивого отображения
    setIsHtmlMode(true);
  };

  // Синхронизация при переключении в визуальный режим
  const handleSwitchToVisual = () => {
    setIsHtmlMode(false);
  };

  // Эффект для синхронизации контента при переключении в визуальный режим
  useEffect(() => {
    if (!isHtmlMode && editorRef.current) {
      editorRef.current.innerHTML = cleanHtmlForEditor(contentRef.current);
    }
  }, [isHtmlMode, cleanHtmlForEditor]);

  // Обработчик изменения textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    contentRef.current = newValue;
    setHtmlValue(newValue);
    onChange(newValue);
  };

  // Кнопки форматирования
  const handleBold = () => execCommand("bold");
  const handleItalic = () => execCommand("italic");
  const handleStrikeThrough = () => execCommand("strikeThrough");
  const handleUnderline = () => execCommand("underline");
  const handleH2 = () => execCommand("formatBlock", "H2");
  const handleH3 = () => execCommand("formatBlock", "H3");
  const handleUnorderedList = () => execCommand("insertUnorderedList");
  const handleOrderedList = () => execCommand("insertOrderedList");

  const handleInsertHr = () => {
    execCommand("insertHorizontalRule");
  };

  const handleInsertLink = () => {
    const url = prompt("Введите URL ссылки:");
    if (url) {
      execCommand("createLink", url);
    }
  };

  const handleInsertImage = () => {
    const url = prompt("Введите URL изображения:");
    if (url) {
      execCommand("insertImage", url);
    }
  };

  // Получение текущего формата блока
  const getCurrentBlockFormat = (): string => {
    try {
      return document.queryCommandValue("formatBlock") || "";
    } catch {
      return "";
    }
  };

  const [blockFormat, setBlockFormat] = useState("");

  useEffect(() => {
    const updateBlockFormat = () => {
      setBlockFormat(getCurrentBlockFormat().toLowerCase());
    };

    const editor = editorRef.current;
    if (editor) {
      editor.addEventListener("mouseup", updateBlockFormat);
      editor.addEventListener("keyup", updateBlockFormat);
    }

    return () => {
      if (editor) {
        editor.removeEventListener("mouseup", updateBlockFormat);
        editor.removeEventListener("keyup", updateBlockFormat);
      }
    };
  }, []);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Toolbar - показываем только в визуальном режиме */}
      {!readOnly && !isHtmlMode && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 border-b border-slate-200 bg-slate-50">
          <div className="flex flex-wrap items-center gap-1">
            {/* Форматирование текста */}
            <ToolbarButton
              onClick={handleBold}
              active={queryCommandState("bold")}
              label="B"
              bold
              tooltip="Жирный (Ctrl+B)"
            />
            <ToolbarButton
              onClick={handleItalic}
              active={queryCommandState("italic")}
              label="I"
              italic
              tooltip="Курсив (Ctrl+I)"
            />
            <ToolbarButton
              onClick={handleStrikeThrough}
              active={queryCommandState("strikeThrough")}
              label="S"
              strikeThrough
              tooltip="Зачеркнутый"
            />
            <ToolbarButton
              onClick={handleUnderline}
              active={queryCommandState("underline")}
              label="U"
              underline
              tooltip="Подчеркнутый (Ctrl+U)"
            />

            <div className="w-[1px] h-6 bg-slate-300 mx-1" />

            {/* Заголовки */}
            <ToolbarButton
              onClick={handleH2}
              active={blockFormat === "h2"}
              label="H2"
              tooltip="Заголовок H2"
            />
            <ToolbarButton
              onClick={handleH3}
              active={blockFormat === "h3"}
              label="H3"
              tooltip="Заголовок H3"
            />

            <div className="w-[1px] h-6 bg-slate-300 mx-1" />

            {/* Списки */}
            <ToolbarButton
              onClick={handleUnorderedList}
              active={queryCommandState("insertUnorderedList")}
              label="• Список"
              tooltip="Маркированный список"
            />
            <ToolbarButton
              onClick={handleOrderedList}
              active={queryCommandState("insertOrderedList")}
              label="1. Список"
              tooltip="Нумерованный список"
            />

            <div className="w-[1px] h-6 bg-slate-300 mx-1" />

            {/* Вставка */}
            <ToolbarButton
              onClick={handleInsertHr}
              label="⎯ Линия"
              tooltip="Вставить горизонтальную линию"
            />
            <ToolbarButton
              onClick={handleInsertLink}
              active={queryCommandState("createLink")}
              label="🔗 Ссылка"
              tooltip="Вставить ссылку"
            />
            <ToolbarButton
              onClick={handleInsertImage}
              label="🖼️ Картинка"
              tooltip="Вставить изображение по URL"
            />
          </div>

          {/* Переключатель режимов */}
          <div className="flex items-center gap-1 border-l border-slate-300 pl-2">
            <button
              type="button"
              onClick={handleSwitchToHtml}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                isHtmlMode
                  ? "bg-[#5858E2] text-white"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Code className="w-4 h-4" />
              HTML
            </button>
          </div>
        </div>
      )}

      {/* Toolbar для HTML режима - только переключатель обратно */}
      {!readOnly && isHtmlMode && (
        <div className="flex items-center justify-end gap-2 p-2 border-b border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={handleSwitchToVisual}
            className="px-3 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 bg-[#5858E2] text-white hover:bg-[#4848d0]"
          >
            <Eye className="w-4 h-4" />
            Визуальный
          </button>
        </div>
      )}

      {/* Editor content */}
      {!isHtmlMode ? (
        <div
          ref={editorRef}
          contentEditable={!readOnly}
          suppressContentEditableWarning
          onInput={handleContentChange}
          onPaste={handleContentChange}
          onBlur={handleContentChange}
          className="admin-wysiwyg-editor prose prose-slate max-w-none focus:outline-none min-h-[500px] px-4 py-6"
          style={{
            minHeight: "500px",
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
          }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={htmlValue}
          onChange={handleTextareaChange}
          disabled={readOnly}
          rows={25}
          className="w-full min-h-[500px] font-mono text-sm bg-slate-50 text-slate-900 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#5858E2]/20"
          spellCheck={false}
          placeholder="HTML код статьи..."
        />
      )}
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  label,
  bold,
  italic,
  strikeThrough,
  underline,
  tooltip,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  bold?: boolean;
  italic?: boolean;
  strikeThrough?: boolean;
  underline?: boolean;
  tooltip?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={tooltip}
      className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
        active
          ? "bg-[#5858E2] text-white shadow-md"
          : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
      }`}
      style={{
        fontWeight: bold ? "bold" : undefined,
        fontStyle: italic ? "italic" : undefined,
        textDecoration: strikeThrough ? "line-through" : underline ? "underline" : undefined,
      }}
    >
      {label}
    </button>
  );
}