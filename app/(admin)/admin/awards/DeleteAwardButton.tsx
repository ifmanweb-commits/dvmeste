'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';

interface DeleteAwardButtonProps {
  awardId: string;
}

export default function DeleteAwardButton({ awardId }: DeleteAwardButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить эту награду? Это действие нельзя отменить.')) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/awards/${awardId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка при удалении');
      }

      window.location.reload();
    } catch (error: any) {
      alert(error.message);
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Trash2 className="w-3.5 h-3.5 inline mr-1" />
      Удалить
    </button>
  );
}