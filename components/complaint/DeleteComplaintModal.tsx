"use client";

import { useState } from "react";
import { deleteComplaint } from "@/lib/actions/admin-complaints";
import { useRouter } from "next/navigation";

type DeleteComplaintModalProps = {
  complaintId: string;
  complaintDate: Date;
  fromName: string;
  toName: string;
  reason: string;
  onClose: () => void;
};

export function DeleteComplaintModal({
  complaintId,
  complaintDate,
  fromName,
  toName,
  reason,
  onClose,
}: DeleteComplaintModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteComplaint(complaintId);

      if (result.success) {
        router.refresh();
        onClose();
      } else {
        setError(result.error || "Ошибка при удалении жалобы");
      }
    } catch (err) {
      setError("Ошибка при удалении жалобы");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Удалить жалобу?</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-5">
          <div className="mb-4 rounded-lg bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <svg
                className="h-6 w-6 flex-shrink-0 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">
                  Вы уверены, что хотите удалить эту жалобу?
                </p>
                <p className="mt-1 text-xs text-red-600">
                  Это действие нельзя отменить. Количество жалоб у клиента будет уменьшено.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Дата жалобы:</span>
              <span className="text-gray-900">{formatDate(complaintDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Психолог:</span>
              <span className="text-gray-900">{fromName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Клиент:</span>
              <span className="text-gray-900">{toName}</span>
            </div>
            <div>
              <span className="text-gray-500">Причина:</span>
              <p className="mt-1 text-gray-900">{reason}</p>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-200 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? "Удаление..." : "Удалить жалобу"}
          </button>
        </div>
      </div>
    </div>
  );
}