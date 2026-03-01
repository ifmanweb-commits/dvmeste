"use client";

import { deletePsychologist } from "@/lib/actions/admin-psychologists";

export function DeletePsychologistButton({ id }: { id: string }) {
  async function handleDelete() {
    if (!confirm("Удалить этого психолога? Это нельзя отменить.")) {
      return;
    }
    
    try {
      await deletePsychologist(id);
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