"use client";

import { useCallback, useEffect, useRef, type MutableRefObject } from "react";

export type ArticleContentEditorApi = {
  insertHtml: (snippet: string) => boolean;
  focus: () => void;
  getMode: () => "plain";
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

export function ArticleContentEditor({
  label,
  value,
  onChange,
  disabled = false,
  required = false,
  placeholder,
  rows = 30,
  storageKey = "articles.editor.mode",
  editorApiRef,
}: Props) {
  const plainTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const insertHtml = useCallback(
    (snippet: string): boolean => {
      const html = snippet || "";
      if (!html.trim()) return false;

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
    []
  );

  useEffect(() => {
    if (!editorApiRef) return;
    editorApiRef.current = {
      insertHtml,
      focus: () => {
        plainTextareaRef.current?.focus();
      },
      getMode: () => "plain",
    };

    return () => {
      if (editorApiRef.current) {
        editorApiRef.current = null;
      }
    };
  }, [editorApiRef, insertHtml]);

  return (
    <div>
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required ? " *" : ""}
        </label>
      </div>

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
    </div>
  );
}
