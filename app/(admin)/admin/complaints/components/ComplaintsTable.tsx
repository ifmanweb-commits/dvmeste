import Link from "next/link";
import { getComplaintReasonLabel } from "@/lib/constants/complaint-reasons";

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

interface ComplaintsTableProps {
  complaints: Complaint[];
  currentPage: number;
  totalPages: number;
  type: "client" | "psychologist";
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

export function ComplaintsTable({
  complaints,
  currentPage,
  totalPages,
  type,
}: ComplaintsTableProps) {
  return (
    <div>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Дата</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">
                {type === "client" ? "Психолог (жалуется)" : "Клиент (жалуется)"}
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">
                {type === "client" ? "Клиент" : "Психолог"}
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Причина</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Описание</th>
            </tr>
          </thead>
          <tbody>
            {complaints.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  Жалоб не найдено
                </td>
              </tr>
            ) : (
              complaints.map((complaint) => (
                <tr
                  key={complaint.id}
                  className="border-t border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(complaint.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    {type === "client" ? (
                      complaint.fromPsychologist ? (
                        <Link
                          href={`/admin/psychologists/${complaint.fromPsychologist.id}/edit`}
                          className="text-[#5858E2] hover:underline"
                        >
                          {complaint.fromPsychologist.fullName || "Без имени"}
                          <br />
                          <span className="text-xs text-gray-500">
                            {complaint.fromPsychologist.email}
                          </span>
                        </Link>
                      ) : (
                        <span className="text-gray-500">Удалён</span>
                      )
                    ) : complaint.fromClient ? (
                      <Link
                        href={`/admin/leads?client=${complaint.fromClient.email}`}
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
                  <td className="px-4 py-3">
                    {type === "client" ? (
                      complaint.toClient ? (
                        <Link
                          href={`/admin/clients/${complaint.toClient.id}`}
                          className="text-[#5858E2] hover:underline"
                        >
                          {complaint.toClient.name || "Без имени"}
                          <br />
                          <span className="text-xs text-gray-500">
                            {complaint.toClient.email}
                          </span>
                        </Link>
                      ) : (
                        <span className="text-gray-500">Удалён</span>
                      )
                    ) : complaint.toPsychologist ? (
                      <Link
                        href={`/admin/psychologists/${complaint.toPsychologist.id}/edit`}
                        className="text-[#5858E2] hover:underline"
                      >
                        {complaint.toPsychologist.fullName || "Без имени"}
                        <br />
                        <span className="text-xs text-gray-500">
                          {complaint.toPsychologist.email}
                        </span>
                      </Link>
                    ) : (
                      <span className="text-gray-500">Удалён</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-xs truncate">
                    {getComplaintReasonLabel(complaint.reason)}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                    {complaint.description || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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