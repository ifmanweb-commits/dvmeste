import Link from "next/link";
import { notFound } from "next/navigation";
import { getClientById } from "@/lib/actions/admin-clients";
import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from "@/lib/lead-status-config";
import { getComplaintReasonLabel } from "@/lib/constants/complaint-reasons";
import { ClientBanButton } from "@/components/client/ClientBanButton";

type PageProps = {
  params: Promise<{ id: string }>;
};

function getStatusColorClass(color: string): string {
  const colors: Record<string, string> = {
    green: "bg-green-100 text-green-800",
    blue: "bg-blue-100 text-blue-800",
    yellow: "bg-yellow-100 text-yellow-800",
    red: "bg-red-100 text-red-800",
    gray: "bg-gray-100 text-gray-800",
    purple: "bg-purple-100 text-purple-800",
  };
  return colors[color] || colors.gray;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params;

  const result = await getClientById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const { client, leads, complaintsTo, complaintsFrom, stats } = result.data;

  return (
    <div className="space-y-6">
      {/* Заголовок и навигация */}
      <div>
        <Link
          href="/admin/clients"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Назад к списку
        </Link>
        <h1 className="text-2xl font-semibold mt-2">Карточка клиента</h1>
      </div>

      {/* Основная информация о клиенте */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Личные данные</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="text-base font-medium">{client.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Имя</p>
            <p className="text-base">{client.name || "Не указано"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Телефон</p>
            <p className="text-base">{client.phone || "Не указано"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Telegram</p>
            <p className="text-base">{client.telegram || "Не указано"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">VK</p>
            <p className="text-base">{client.vk || "Не указано"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">ID</p>
            <p className="text-base font-mono text-sm">{client.id}</p>
          </div>
        </div>

        {/* Статусы */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Особые статусы</h3>
          <div className="flex flex-wrap gap-3">
            {client.isShadowBanned ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                ⚠️ Теневой бан
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                ✓ Активен
              </span>
            )}
            {client.complaintCount > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                📋 Жалоб: {client.complaintCount}
              </span>
            )}
          </div>
        </div>

        {/* Даты */}
        <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Зарегистрирован</p>
            <p className="text-base">{formatDate(client.createdAt)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Последнее обновление</p>
            <p className="text-base">{formatDate(client.updatedAt)}</p>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Всего заявок</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalLeads}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Жалоб на клиента</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalComplaintsTo}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Нерешённых жалоб</p>
          <p className="text-2xl font-bold text-red-600">{stats.unresolvedComplaintsTo}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Жалоб от клиента</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalComplaintsFrom}</p>
        </div>
      </div>

      {/* Заявки */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Заявки ({leads.length})</h2>
        {leads.length === 0 ? (
          <p className="text-gray-500">Заявок нет</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Дата</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Психолог</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Статус</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Исход</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Сообщение</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Подозрительная</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/psychologists/${lead.psychologist.id}/edit`}
                        className="text-[#5858E2] hover:underline"
                      >
                        {lead.psychologist.fullName || "Без имени"}
                        <br />
                        <span className="text-xs text-gray-500">
                          {lead.psychologist.email}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColorClass(
                          LEAD_STATUS_COLORS[lead.status]
                        )}`}
                      >
                        {LEAD_STATUS_LABELS[lead.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {lead.resolution || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                      {lead.message || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {lead.isSuspicious ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          ⚠️ {lead.suspiciousReason || "Да"}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Жалобы на клиента */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Жалобы на клиента ({complaintsTo.length})</h2>
        {complaintsTo.length === 0 ? (
          <>
            <p className="text-gray-500">Жалоб нет</p>
            <ClientBanButton clientId={client.id} isBanned={client.isShadowBanned} />
          </>
        ) : (
          <>
            <div className="space-y-4">
            {complaintsTo.map((complaint) => (
              <div
                key={complaint.id}
                className={`border rounded-lg p-4 ${
                  complaint.resolvedAt ? "bg-gray-50 border-gray-200" : "bg-yellow-50 border-yellow-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(complaint.createdAt)}
                    </span>
                    {complaint.resolvedAt ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Решена
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Нерешена
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Кто пожаловался</p>
                    <p className="text-base">
                      {complaint.fromType === "psychologist" ? (
                        complaint.fromPsychologist ? (
                          <Link
                            href={`/admin/psychologists/${complaint.fromPsychologist.id}/edit`}
                            className="text-[#5858E2] hover:underline"
                          >
                            {complaint.fromPsychologist.fullName} ({complaint.fromPsychologist.email})
                          </Link>
                        ) : (
                          "Удалённый психолог"
                        )
                      ) : complaint.fromClient ? (
                        `${complaint.fromClient.name || "Без имени"} (${complaint.fromClient.email})`
                      ) : (
                        "Удалённый клиент"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Причина</p>
                    <p className="text-base">{getComplaintReasonLabel(complaint.reason)}</p>
                  </div>
                </div>
                {complaint.description && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-500">Описание</p>
                    <p className="text-base text-gray-700 whitespace-pre-wrap">{complaint.description}</p>
                  </div>
                )}
                {complaint.resolution && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-500">Решение</p>
                    <p className="text-base text-gray-700">{complaint.resolution}</p>
                  </div>
                )}
              </div>
            ))}
            </div>
            <ClientBanButton clientId={client.id} isBanned={client.isShadowBanned} />
          </>
        )}
      </div>

      {/* Жалобы от клиента */}
      {complaintsFrom.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Жалобы от клиента ({complaintsFrom.length})</h2>
          <div className="space-y-4">
            {complaintsFrom.map((complaint) => (
              <div key={complaint.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(complaint.createdAt)}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">На кого пожаловался</p>
                    <p className="text-base">
                      {complaint.toPsychologist ? (
                        <Link
                          href={`/admin/psychologists/${complaint.toPsychologist.id}/edit`}
                          className="text-[#5858E2] hover:underline"
                        >
                          {complaint.toPsychologist.fullName} ({complaint.toPsychologist.email})
                        </Link>
                      ) : complaint.toClient ? (
                        `${complaint.toClient.name || "Без имени"} (${complaint.toClient.email})`
                      ) : (
                        "Удалённый"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Причина</p>
                    <p className="text-base">{getComplaintReasonLabel(complaint.reason)}</p>
                  </div>
                </div>
                {complaint.description && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-500">Описание</p>
                    <p className="text-base text-gray-700 whitespace-pre-wrap">{complaint.description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}