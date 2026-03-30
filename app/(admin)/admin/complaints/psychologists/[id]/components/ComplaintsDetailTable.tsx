"use client";

import Link from "next/link";
import { useState } from "react";
import { deleteComplaint, resolveComplaint } from "@/lib/actions/admin-complaints";

interface Complaint {
  id: string;
  fromType: string;
  fromClient: { id: string; email: string; name: string | null } | null;
  fromPsychologist: { id: string; fullName: string | null; email: string } | null;
  toClient: { id: string; email: string; name: string | null } | null;
  toPsychologist: { id: string; fullName: string | null; email: string } | null;
  reason: string;
  description: string | null;
  lead: { id: string } | null;
  createdAt: Date;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  resolution: string | null;
}

interface ComplaintsDetailTableProps {
  complaints: Complaint[];
  currentPage: number;
  totalPages: number;
  psychologistId: string;
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export function ComplaintsDetailTable({
  complaints,
  currentPage,
  totalPages,
  psychologistId,
}: ComplaintsDetailTableProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (complaintId: string) => {
    setProcessingId(complaintId);
    setError(null);
    
    const result = await deleteComplaint(complaintId);
    
    if (result.success) {
      window.location.reload();
    } else {
      setError(result.error || "Ошибка при удалении жалобы");
      setProcessingId(null);
      setDeleteConfirmId(null);
    }
  };

  const handleResolve = async (complaintId: string) => {
    setProcessingId(complaintId);
    setError(null);
    
    const result = await resolveComplaint(complaintId, "Принята");
    
    if (result.success) {
      window.location.reload();
    } else {
      setError(result.error || "Ошибка при принятии жалобы");
      setProcessingId(null);
    }
  };

  return (
    <div>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Дата</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Клиент (жалуется)</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Причина</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Описание</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Статус</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Действия</th>
            </tr>
          </thead>
          <tbody>
            {complaints.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Жалоб не найдено
                </td>
              </tr>
            ) : (
              complaints.map((complaint) => (
                <tr
                  key={complaint.id}
                  className={`border-t border-gray-100 hover:bg-gray-50 ${
                    complaint.resolvedAt ? "bg-gray-50" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(complaint.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    {complaint.fromClient ? (
                      <Link
                        href={`/admin/clients/${complaint.fromClient.id}`}
                        className="text-[#5858E2] hover:underline"
                      >
                        {complaint.fromClient.name || "Без имени"}
                        <br />
                        <span className="text-xs text-gray-500">
                          {complaint.fromClient.email}
                        </span>
                      </Link>
                    ) : (
                      <span className="text-gray-500">Удалён</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-xs truncate">
                    {complaint.reason}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                    {complaint.description || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {complaint.resolvedAt ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {complaint.resolution || "Принята"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Нерешена
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {!complaint.resolvedAt ? (
                      <div className="flex gap-2">
                        {deleteConfirmId === complaint.id ? (
                          <>
                            <button
                              onClick={() => handleDelete(complaint.id)}
                              disabled={processingId === complaint.id}
                              className="text-xs px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              {processingId === complaint.id ? "..." : "Да"}
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              disabled={processingId === complaint.id}
                              className="text-xs px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                              Отмена
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setDeleteConfirmId(complaint.id)}
                              disabled={processingId !== null}
                              className="text-xs px-3 py-1 rounded border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              Удалить
                            </button>
                            <button
                              onClick={() => handleResolve(complaint.id)}
                              disabled={processingId === complaint.id}
                              className="text-xs px-3 py-1 rounded border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-50"
                            >
                              {processingId === complaint.id ? "..." : "Принять"}
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">
                        Решена {formatDate(complaint.resolvedAt)}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          {currentPage > 1 && (
            <Link
              href={`?page=${currentPage - 1}`}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              ← Назад
            </Link>
          )}
          <span className="text-gray-600">
            Страница {currentPage} из {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link
              href={`?page=${currentPage + 1}`}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Вперёд →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}