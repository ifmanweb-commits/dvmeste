"use client";

import { Trash2 } from "lucide-react";
import { deletePage } from "@/lib/actions/manager-pages";
import { useRouter } from "next/navigation";

interface DeleteButtonProps {
  pageId: string;
}

export default function DeleteButton({ pageId }: DeleteButtonProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (confirm("Удалить страницу?")) {
      await deletePage(pageId);
                                                                          
    }
  };

  return (
    <button
      onClick={handleDelete}
      type="button"                                       
      className="inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 active:bg-red-100 transition-colors w-full sm:w-auto"
    >
      <Trash2 className="h-3.5 w-3.5" />
      <span className="sm:hidden">Удал.</span>
      <span className="hidden sm:inline">Удалить</span>
    </button>
  );
}