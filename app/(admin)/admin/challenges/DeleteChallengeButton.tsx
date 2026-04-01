'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DeleteChallengeButtonProps {
  challengeId: string;
}

export default function DeleteChallengeButton({ challengeId }: DeleteChallengeButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить это испытание? Это действие нельзя отменить.')) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/challenges/${challengeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(`Ошибка при удалении: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting challenge:', error);
      alert('Произошла ошибка при удалении');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isDeleting ? 'Удаление...' : 'Удалить'}
    </button>
  );
}