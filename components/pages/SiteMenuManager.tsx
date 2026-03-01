"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, Plus, Save, Trash2 } from "lucide-react";
import { saveSiteMenu, type SiteMenuScope } from "@/lib/actions/site-menu";
import { normalizeMenuHrefInput, type SiteMenuItem, type SiteMenuPageOption } from "@/lib/site-menu-shared";

type LocalMenuItem = SiteMenuItem & {
  draftHref: string;
};

function createLocalId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `menu-${crypto.randomUUID()}`;
  }
  return `menu-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toLocal(items: SiteMenuItem[]): LocalMenuItem[] {
  return items.map((item) => ({ ...item, draftHref: item.href }));
}

const scopeStyle: Record<
  SiteMenuScope,
  {
    accent: string;
    accentSoft: string;
    accentBorder: string;
    saveBtn: string;
  }
> = {
  admin: {
    accent: "text-[#5858E2]",
    accentSoft: "bg-[#5858E2]/10",
    accentBorder: "border-[#5858E2]/25",
    saveBtn: "bg-[#5858E2] hover:bg-[#4848d0]",
  },
  manager: {
    accent: "text-[#2e7d32]",
    accentSoft: "bg-[#4CAF50]/10",
    accentBorder: "border-[#4CAF50]/25",
    saveBtn: "bg-[#4CAF50] hover:bg-[#43A047]",
  },
};

export function SiteMenuManager({
  scope,
  initialItems,
  pageOptions,
}: {
  scope: SiteMenuScope;
  initialItems: SiteMenuItem[];
  pageOptions: SiteMenuPageOption[];
}) {
  const [items, setItems] = useState<LocalMenuItem[]>(() => toLocal(initialItems));
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newHref, setNewHref] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const styles = scopeStyle[scope];

  const hintOptions = useMemo(() => pageOptions.map((entry) => entry.href), [pageOptions]);

  const onAddItem = () => {
    setError(null);
    setSuccess(null);

    const label = newLabel.trim().replace(/\s+/g, " ").slice(0, 80);
    const href = normalizeMenuHrefInput(newHref);
    if (!label || !href) {
      setError("Заполните название и адрес/slug пункта меню.");
      return;
    }

    setItems((prev) => [...prev, { id: createLocalId(), label, href, draftHref: href }]);
    setNewLabel("");
    setNewHref("");
  };

  const onDeleteItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setError(null);
    setSuccess(null);
  };

  const onMoveItem = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    setItems((prev) => {
      const next = [...prev];
      const [current] = next.splice(index, 1);
      next.splice(targetIndex, 0, current);
      return next;
    });
    setError(null);
    setSuccess(null);
  };

  const onChangeItem = (index: number, key: "label" | "draftHref", value: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    );
    setError(null);
    setSuccess(null);
  };

  const onDragStart = (event: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    event.dataTransfer.effectAllowed = "move";
    event.currentTarget.classList.add("opacity-50");
  };

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const onDragEnd = (event: React.DragEvent) => {
    event.currentTarget.classList.remove("opacity-50");
    setDraggedIndex(null);
  };

  const onDrop = (event: React.DragEvent, targetIndex: number) => {
    event.preventDefault();
    event.currentTarget.classList.remove("border-blue-400", "bg-blue-50");

    if (draggedIndex === null) return;
    const updated = [...items];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, moved);
    setItems(updated);
    setDraggedIndex(null);
  };

  const onDragEnter = (event: React.DragEvent) => {
    event.currentTarget.classList.add("border-blue-400", "bg-blue-50");
  };

  const onDragLeave = (event: React.DragEvent) => {
    event.currentTarget.classList.remove("border-blue-400", "bg-blue-50");
  };

  const onSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload = items.map((item) => ({
      id: item.id,
      label: item.label,
      href: item.draftHref,
    }));

    const result = await saveSiteMenu(scope, payload);
    if (!result.success) {
      setError(result.error);
      setSaving(false);
      return;
    }

    setItems(toLocal(result.items));
    setSuccess("Меню успешно сохранено.");
    setSaving(false);
  };

  return (
    <section className="mt-6 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Пункты главного меню</h2>
          <p className="mt-1 text-sm text-gray-600">
            Таблица управляет только главным меню в шапке сайта. Для сортировки перетаскивайте строки.
          </p>
        </div>

        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${styles.saveBtn}`}
        >
          <Save className="h-4 w-4" />
          {saving ? "Сохранение..." : "Сохранить меню"}
        </button>
      </div>

      <div className="mt-4 grid gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 md:grid-cols-12">
        <input
          value={newLabel}
          onChange={(event) => setNewLabel(event.target.value)}
          placeholder="Название пункта меню"
          className="h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20 md:col-span-4"
        />
        <input
          value={newHref}
          onChange={(event) => setNewHref(event.target.value)}
          placeholder="Адрес или slug (например /contacts, contacts, https://example.com)"
          list={`${scope}-menu-hints`}
          className="h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20 md:col-span-7"
        />
        <datalist id={`${scope}-menu-hints`}>
          {hintOptions.map((href) => (
            <option key={href} value={href} />
          ))}
        </datalist>
        <button
          type="button"
          onClick={onAddItem}
          className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border ${styles.accentBorder} ${styles.accentSoft} px-3 text-sm font-medium ${styles.accent} md:col-span-1`}
        >
          <Plus className="h-4 w-4" />
          Добавить
        </button>
      </div>

      {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {success && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="mt-4 space-y-3 md:hidden">
        {items.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-6 text-center text-sm text-gray-500">
            Список пуст. Добавьте первый пункт меню.
          </div>
        ) : (
          items.map((item, index) => (
            <div key={item.id} className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <GripVertical className="h-4 w-4 text-gray-400" />
                  {index + 1}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onMoveItem(index, "up")}
                    disabled={index === 0}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Поднять выше"
                    title="Поднять выше"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveItem(index, "down")}
                    disabled={index === items.length - 1}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Опустить ниже"
                    title="Опустить ниже"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteItem(index)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 text-red-600 transition-colors hover:bg-red-50"
                    aria-label="Удалить пункт"
                    title="Удалить пункт"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <input
                  value={item.label}
                  onChange={(event) => onChangeItem(index, "label", event.target.value)}
                  maxLength={80}
                  className="h-9 w-full rounded-md border border-gray-300 px-2 text-sm text-gray-900 outline-none focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
                  placeholder="Название пункта"
                />
                <input
                  value={item.draftHref}
                  onChange={(event) => onChangeItem(index, "draftHref", event.target.value)}
                  className="h-9 w-full rounded-md border border-gray-300 px-2 text-sm text-gray-900 outline-none focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
                  placeholder="Адрес или slug"
                />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 hidden overflow-hidden rounded-lg border border-gray-200 md:block">
        <div>
          <table className="w-full table-fixed divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Порядок</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Название</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Адрес или slug</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-sm text-gray-500">
                    Список пуст. Добавьте первый пункт меню.
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr
                    key={item.id}
                    draggable
                    onDragStart={(event) => onDragStart(event, index)}
                    onDragOver={onDragOver}
                    onDragEnd={onDragEnd}
                    onDrop={(event) => onDrop(event, index)}
                    onDragEnter={onDragEnter}
                    onDragLeave={onDragLeave}
                    className={draggedIndex === index ? "opacity-50" : ""}
                  >
                    <td className="px-3 py-2">
                      <div className="inline-flex items-center gap-2 text-sm text-gray-600">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={item.label}
                        onChange={(event) => onChangeItem(index, "label", event.target.value)}
                        maxLength={80}
                        className="h-9 w-full rounded-md border border-gray-300 px-2 text-sm text-gray-900 outline-none focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={item.draftHref}
                        onChange={(event) => onChangeItem(index, "draftHref", event.target.value)}
                        className="h-9 w-full rounded-md border border-gray-300 px-2 text-sm text-gray-900 outline-none focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onMoveItem(index, "up")}
                          disabled={index === 0}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Поднять выше"
                          title="Поднять выше"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onMoveItem(index, "down")}
                          disabled={index === items.length - 1}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Опустить ниже"
                          title="Опустить ниже"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteItem(index)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-200 text-red-600 transition-colors hover:bg-red-50"
                          aria-label="Удалить пункт"
                          title="Удалить пункт"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
