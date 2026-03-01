"use client";

import { useCallback, useEffect, useId, useRef, useState, type MutableRefObject } from "react";

type EditorMode = "plain" | "wysiwyg";

type TinyMceEditorInstance = {
  getContent: () => string;
  setContent: (content: string) => void;
  insertContent?: (content: string) => void;
  focus?: () => void;
  on: (event: string, callback: () => void) => void;
  remove: () => void;
};

type TinyMceGlobal = {
  init: (options: Record<string, unknown>) => Promise<TinyMceEditorInstance[]> | void;
  get: (id: string) => TinyMceEditorInstance | null;
};

declare global {
  interface Window {
    tinymce?: TinyMceGlobal;
  }
}

export type ArticleContentEditorApi = {
  insertHtml: (snippet: string) => boolean;
  focus: () => void;
  getMode: () => EditorMode;
};

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  storageKey?: string;
  editorApiRef?: MutableRefObject<ArticleContentEditorApi | null>;
};

const TINYMCE_SCRIPT_ID = "tinymce-cdn-script";
const TINYMCE_SCRIPT_SRC = "https://cdn.jsdelivr.net/npm/tinymce@7.9.1/tinymce.min.js";
const DEFAULT_STORAGE_KEY = "articles.editor.mode";

let tinyMceLoader: Promise<TinyMceGlobal> | null = null;

function ensureTinyMce(): Promise<TinyMceGlobal> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("window_unavailable"));
  }

  if (window.tinymce) {
    return Promise.resolve(window.tinymce);
  }

  if (tinyMceLoader) {
    return tinyMceLoader;
  }

  tinyMceLoader = new Promise<TinyMceGlobal>((resolve, reject) => {
    const done = () => {
      if (window.tinymce) {
        resolve(window.tinymce);
      } else {
        tinyMceLoader = null;
        reject(new Error("tinymce_not_available"));
      }
    };

    const fail = () => {
      tinyMceLoader = null;
      reject(new Error("tinymce_load_failed"));
    };

    const existing = document.getElementById(TINYMCE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (existing.getAttribute("data-ready") === "1") {
        done();
        return;
      }
      existing.addEventListener("load", done, { once: true });
      existing.addEventListener("error", fail, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = TINYMCE_SCRIPT_ID;
    script.src = TINYMCE_SCRIPT_SRC;
    script.async = true;
    script.referrerPolicy = "origin";
    script.addEventListener(
      "load",
      () => {
        script.setAttribute("data-ready", "1");
        done();
      },
      { once: true }
    );
    script.addEventListener("error", fail, { once: true });
    document.head.appendChild(script);
  });

  return tinyMceLoader;
}

export function ArticleContentEditor({
  label,
  value,
  onChange,
  disabled = false,
  required = false,
  placeholder,
  rows = 14,
  storageKey = DEFAULT_STORAGE_KEY,
  editorApiRef,
}: Props) {
  const [mode, setMode] = useState<EditorMode>("plain");
  const [isClientReady, setIsClientReady] = useState(false);
  const [isLoadingEditor, setIsLoadingEditor] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const plainTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const editorRef = useRef<TinyMceEditorInstance | null>(null);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  const generatedId = useId();
  const editorIdRef = useRef(`article-editor-${generatedId.replace(/:/g, "")}`);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedMode = window.localStorage.getItem(storageKey);
    if (storedMode === "wysiwyg" || storedMode === "plain") {
      setMode(storedMode);
    }
    setIsClientReady(true);
  }, [storageKey]);

  useEffect(() => {
    if (!isClientReady || typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, mode);
  }, [isClientReady, mode, storageKey]);

  useEffect(() => {
    if (!isClientReady || mode !== "wysiwyg") {
      editorRef.current?.remove();
      editorRef.current = null;
      setIsLoadingEditor(false);
      setEditorError(null);
      return;
    }

    const textarea = textareaRef.current;
    if (!textarea) return;

    let cancelled = false;
    setIsLoadingEditor(true);
    setEditorError(null);

    void ensureTinyMce()
      .then((tiny) => {
        if (cancelled || !textareaRef.current) return;

        const target = textareaRef.current;
        target.id = editorIdRef.current;

        const existing = tiny.get(editorIdRef.current);
        if (existing) existing.remove();

        const initResult = tiny.init({
          target,
          base_url: "https://cdn.jsdelivr.net/npm/tinymce@7.9.1",
          suffix: ".min",
          license_key: "gpl",
          menubar: "edit insert format table view",
          branding: false,
          promotion: false,
          statusbar: true,
          convert_urls: false,
          relative_urls: false,
          remove_script_host: false,
          plugins: "autoresize lists link table code fullscreen",
          toolbar:
            "undo redo | blocks fontsize | bold italic underline | forecolor backcolor | alignleft aligncenter alignright | bullist numlist outdent indent | link table | removeformat | code fullscreen",
          font_size_formats: "12px 14px 16px 18px 20px 24px 28px 32px 36px",
          min_height: 320,
          max_height: 1000,
          autoresize_bottom_margin: 20,
          placeholder,
          readonly: disabled ? 1 : 0,
          content_style: "body{font-family:Arial,sans-serif;font-size:16px;line-height:1.6;padding:8px;}",
          setup: (editor: TinyMceEditorInstance) => {
            editor.on("Change KeyUp Undo Redo SetContent Input NodeChange Paste", () => {
              onChangeRef.current(editor.getContent());
            });
          },
        });

        const attachEditor = (instance: TinyMceEditorInstance | null) => {
          if (cancelled || !instance) return;
          editorRef.current = instance;
          instance.setContent(valueRef.current || "");
          setIsLoadingEditor(false);
        };

        if (initResult && typeof (initResult as Promise<TinyMceEditorInstance[]>).then === "function") {
          (initResult as Promise<TinyMceEditorInstance[]>)
            .then((instances) => {
              attachEditor(instances[0] ?? tiny.get(editorIdRef.current));
            })
            .catch(() => {
              if (cancelled) return;
              setIsLoadingEditor(false);
              setEditorError("Не удалось инициализировать WYSIWYG-редактор.");
              setMode("plain");
            });
          return;
        }

        window.setTimeout(() => attachEditor(tiny.get(editorIdRef.current)), 0);
      })
      .catch(() => {
        if (cancelled) return;
        setIsLoadingEditor(false);
        setEditorError("Не удалось загрузить WYSIWYG-редактор. Используется обычный режим.");
        setMode("plain");
      });

    return () => {
      cancelled = true;
      editorRef.current?.remove();
      editorRef.current = null;
    };
  }, [isClientReady, mode, disabled, placeholder]);

  useEffect(() => {
    if (mode !== "wysiwyg") return;
    const editor = editorRef.current;
    if (!editor) return;
    const current = editor.getContent();
    if (current !== value) {
      editor.setContent(value || "");
    }
  }, [mode, value]);

  const insertHtml = useCallback(
    (snippet: string): boolean => {
      const html = snippet || "";
      if (!html.trim()) return false;

      if (mode === "wysiwyg") {
        const editor = editorRef.current;
        if (editor && typeof editor.insertContent === "function") {
          editor.focus?.();
          editor.insertContent(html);
          onChangeRef.current(editor.getContent());
          return true;
        }
        return false;
      }

      const textarea = plainTextareaRef.current;
      const currentValue = valueRef.current || "";
      const start = textarea?.selectionStart ?? currentValue.length;
      const end = textarea?.selectionEnd ?? currentValue.length;
      const nextValue = `${currentValue.slice(0, start)}${html}${currentValue.slice(end)}`;
      const caret = start + html.length;

      onChangeRef.current(nextValue);

      window.setTimeout(() => {
        const node = plainTextareaRef.current;
        if (!node) return;
        node.focus();
        node.setSelectionRange(caret, caret);
      }, 0);

      return true;
    },
    [mode]
  );

  useEffect(() => {
    if (!editorApiRef) return;
    editorApiRef.current = {
      insertHtml,
      focus: () => {
        if (mode === "wysiwyg") {
          editorRef.current?.focus?.();
          return;
        }
        plainTextareaRef.current?.focus();
      },
      getMode: () => mode,
    };

    return () => {
      if (editorApiRef.current) {
        editorApiRef.current = null;
      }
    };
  }, [editorApiRef, insertHtml, mode]);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required ? " *" : ""}
        </label>
        <button
          type="button"
          onClick={() => setMode((prev) => (prev === "wysiwyg" ? "plain" : "wysiwyg"))}
          className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
          disabled={disabled}
        >
          {mode === "wysiwyg" ? "WYSIWYG: вкл" : "WYSIWYG: выкл"}
        </button>
      </div>

      {mode === "wysiwyg" && (
        <div className="mb-2">
          {isLoadingEditor && <p className="text-xs text-gray-500">Загружаем WYSIWYG-редактор...</p>}
          {editorError && <p className="text-xs text-amber-600">{editorError}</p>}
        </div>
      )}

      {mode === "wysiwyg" ? (
        <textarea
          ref={textareaRef}
          defaultValue={value}
          disabled={disabled}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
          rows={rows}
        />
      ) : (
        <textarea
          ref={plainTextareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          required={required}
          rows={rows}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
        />
      )}
    </div>
  );
}
