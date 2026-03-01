"use client";

import { deletePsychologist } from "@/lib/actions/manager-psychologist"
import { useRouter } from "next/navigation";

interface DeletePsychologistButtonProps {
  id: string;
}

export default function DeletePsychologistButton({ id }: DeletePsychologistButtonProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (confirm("Удалить анкету психолога? Это действие нельзя отменить.")) {
      await deletePsychologist(id);
    }
  };

  return (
    <button
      onClick={handleDelete}
      type="button"
      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
    >
      Удалить психолога
    </button>
  );
}