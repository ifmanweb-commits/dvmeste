"use client";

import { deletePage } from "@/lib/actions/admin-pages";

export function DeletePageButton({ id }: { id: string }) {
  async function handleDelete() {
    if (!confirm("Удалить эту страницу?")) {
      return;
    }
    
    try {
      await deletePage(id);
    } catch (error) {
      console.error("Ошибка удаления:", error);
    }
  }

  return (
    <button
      onClick={handleDelete}
      type="button"
      className="rounded-xl border border-red-200 bg-red-50 px-6 py-2 font-medium text-red-700 hover:bg-red-100"
    >
      Удалить
    </button>
  );
}