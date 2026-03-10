"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, ChevronDown } from "lucide-react";

type ArticleTagsSelectorProps = {
  label?: string;
  availableTags: string[];
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
};

function normalizeTag(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function ArticleTagsSelector({
  label = "Тэги",
  availableTags,
  value,
  onChange,
  disabled,
  placeholder = "Начните вводить тэг...",
}: ArticleTagsSelectorProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedTags = useMemo(() => {
    const set = new Set(value.map(normalizeTag).filter(Boolean));
    return [...set];
  }, [value]);

  const options = useMemo(() => {
    const q = search.trim().toLowerCase();
    const selected = new Set(selectedTags);
    const base = availableTags
      .map(normalizeTag)
      .filter(Boolean)
      .filter((tag) => !selected.has(tag));
    if (!q) return base;
    return base.filter((tag) => tag.toLowerCase().includes(q));
  }, [availableTags, selectedTags, search]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const addTag = (tag: string) => {
    const normalized = normalizeTag(tag);
    if (!normalized) return;
    if (selectedTags.includes(normalized)) return;
    onChange([...selectedTags, normalized]);
    setSearch("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const removeTag = (tag: string) => {
    onChange(selectedTags.filter((item) => item !== tag));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (options.length > 0) {
        addTag(options[0]);
      }
      return;
    }
    if (event.key === "Backspace" && !search && selectedTags.length > 0) {
      event.preventDefault();
      onChange(selectedTags.slice(0, -1));
    }
  };

  return (
    <div ref={containerRef} className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 px-10 py-3 text-gray-900 focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20 disabled:cursor-not-allowed disabled:bg-gray-50"
        />
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
          aria-label="Открыть список тэгов"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {isOpen && !disabled && (
        <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow">
          {options.length > 0 ? (
            options.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className="block w-full border-b border-gray-100 px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-50 last:border-b-0"
              >
                {tag}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">Ничего не найдено</div>
          )}
        </div>
      )}

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                disabled={disabled}
                className="text-blue-500 hover:text-blue-700 disabled:cursor-not-allowed"
                aria-label={`Удалить тэг ${tag}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500">
        Выбирайте из списка тэгов. Новые тэги добавляются и переименовываются в разделе «Списки данных».
      </p>
    </div>
  );
}
