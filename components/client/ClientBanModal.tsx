"use client";

import { useState } from "react";
import { toggleClientShadowBan } from "@/lib/actions/admin-clients";
import { useRouter } from "next/navigation";

type ClientBanModalProps = {
  clientId: string;
  isBanned: boolean;
  onClose: () => void;
};

export function ClientBanModal({
  clientId,
  isBanned,
  onClose,
}: ClientBanModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await toggleClientShadowBan(clientId);

      if (result.success) {
        router.refresh();
        onClose();
      } else {
        setError(result.error || "Ошибка при выполнении операции");
      }
    } catch (err) {
      setError("Ошибка при выполнении операции");
    } finally {
      setIsProcessing(false);
    }
  };

  const title = isBanned ? "Разбанить клиента?" : "Забанить клиента?";
  const description = isBanned
    ? "Это выведет клиента из теневого бана. Его заявки будут показываться психологам как обычно."
    : "Клиент поместится в теневой бан. Его заявки будут сразу помечаться очень подозрительными и не рекомендоваться для психологов к принятию.";
  const confirmButtonText = isBanned ? "Разбанить" : "Забанить";
  const confirmButtonColor = isBanned
    ? "bg-green-600 hover:bg-green-700"
    : "bg-red-600 hover:bg-red-700";
  const iconColor = isBanned ? "text-green-600" : "text-red-600";
  const iconBgColor = isBanned ? "bg-green-100" : "bg-red-100";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-5">
          <div className={`mb-4 rounded-lg ${iconBgColor} p-4`}>
            <div className="flex items-start gap-3">
              <svg
                className={`h-6 w-6 flex-shrink-0 ${iconColor}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isBanned ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                )}
              </svg>
              <div className="flex-1">
                <p className={`text-sm font-medium ${isBanned ? "text-green-800" : "text-red-800"}`}>
                  {isBanned ? "Подтверждение разбана" : "Подтверждение бана"}
                </p>
                <p className={`mt-1 text-xs ${isBanned ? "text-green-600" : "text-red-600"}`}>
                  {description}
                </p>
              </div>
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
            disabled={isProcessing}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isProcessing}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 ${confirmButtonColor}`}
          >
            {isProcessing ? "Обработка..." : confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}