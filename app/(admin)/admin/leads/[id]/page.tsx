import { requireAdmin } from "@/lib/auth/require";
import { getAdminLeadById, getPsychologistDialogId } from "@/lib/actions/leads";
import { LeadStatus, LeadResolution } from "@prisma/client";
import Link from "next/link";
import { SuspiciousButton, ShadowBanButton } from "./actions";

// Компонент кнопки "Написать психологу" - получает ID диалога на сервере
async function WriteToPsychologistButton({ psychologistId }: { psychologistId: string }) {
  const dialogResult = await getPsychologistDialogId(psychologistId);
  
  if (!dialogResult.success || !dialogResult.dialogId) {
    return (
      <span className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed">
        Ошибка
      </span>
    );
  }

  return (
    <Link
      href={`/admin/messages/${dialogResult.dialogId}`}
      className="px-4 py-2 bg-[#5858E2] text-white rounded-lg text-sm font-medium hover:bg-[#4b4bcf] transition-colors"
    >
      Написать психологу
    </Link>
  );
}

interface PageProps {
  params: Promise<{ id: string }>;
}

// Перевод статусов
const getStatusText = (status: LeadStatus) => {
  const texts: Record<LeadStatus, string> = {
    NEW: "Новая",
    ACCEPTED: "Принята",
    COMPLETED: "Завершена",
  };
  return texts[status];
};

export default async function AdminLeadDetailPage({ params }: PageProps) {
  await requireAdmin();

  const { id } = await params;
  const result = await getAdminLeadById(id);

  if (!result.success || !result.data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {result.error || "Ошибка загрузки заявки"}
        </div>
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-2 text-sm text-[#5858E2] hover:text-[#4b4bcf] mt-4"
        >
          ← Назад к списку
        </Link>
      </div>
    );
  }

  const lead = result.data;

  const getStatusBadgeClass = (status: LeadStatus) => {
    switch (status) {
      case LeadStatus.NEW:
        return "bg-green-100 text-green-800";
      case LeadStatus.ACCEPTED:
        return "bg-blue-100 text-blue-800";
      case LeadStatus.COMPLETED:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getResolutionText = (resolution: LeadResolution | null) => {
    if (!resolution) return null;
    const texts: Record<LeadResolution, string> = {
      PSYCHOLOGIST_REJECTED: "Психолог отказал",
      NO_CONTACT: "Не удалось связаться",
      NO_AGREEMENT: "Не договорились",
      CLIENT_DROPPED: "Клиент пропал",
      FREE_ONLY: "Только бесплатная",
      PAID_COMPLETED: "Платная завершена",
    };
    return texts[resolution];
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
    <div className="p-6 max-w-4xl mx-auto">
      {/* Хедер */}
      <div className="mb-6">
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-2 text-sm text-[#5858E2] hover:text-[#4b4bcf] mb-4"
        >
          ← Назад к списку
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Заявка #{lead.id.slice(0, 8)}
          </h1>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(
              lead.status
            )}`}
          >
            {getStatusText(lead.status)}
          </span>
        </div>
      </div>

      {/* Основная информация */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Информация о заявке
        </h2>

        <div className="space-y-4">
          {/* Дата создания */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Дата создания</p>
              <p className="text-gray-900">{formatDate(lead.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Просмотрена</p>
              <p className="text-gray-900">
                {lead.viewedAt ? formatDate(lead.viewedAt) : "—"}
              </p>
            </div>
          </div>

          {/* Сообщение */}
          {lead.message && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Сообщение клиента</p>
              <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 rounded-lg p-4">
                {lead.message}
              </p>
            </div>
          )}

          {/* Статус и исход */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Статус</p>
              <span
                className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(
                  lead.status
                )}`}
              >
                {getStatusText(lead.status)}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Исход</p>
              <p className="text-gray-900">
                {getResolutionText(lead.resolution) || "—"}
              </p>
            </div>
          </div>

          {/* Подозрительная */}
          {lead.isSuspicious && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">⚠️ Подозрительная заявка</p>
              {lead.suspiciousReason && (
                <p className="text-red-600 text-sm mt-1">{lead.suspiciousReason}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Клиент */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Клиент</h2>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Имя</p>
              <p className="text-gray-900">{lead.client.name || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-gray-900">{lead.client.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Телефон</p>
              <p className="text-gray-900">{lead.client.phone || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Telegram</p>
              <p className="text-gray-900">{lead.client.telegram || "—"}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">VK</p>
              <p className="text-gray-900">{lead.client.vk || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Дата регистрации</p>
              <p className="text-gray-900">{formatDate(lead.client.createdAt)}</p>
            </div>
          </div>

          {/* Бейджи клиента */}
          <div className="flex gap-2 mt-4">
            {lead.client.isShadowBanned && (
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                ⚠️ Теневой бан
              </span>
            )}
            {lead.client.complaintCount > 0 && (
              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                Жалоб: {lead.client.complaintCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Психолог */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Психолог</h2>

        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-500">ФИО</p>
            <Link
              href={`/admin/psychologists/${lead.psychologist.id}/edit`}
              className="text-[#5858E2] hover:underline font-medium"
            >
              {lead.psychologist.fullName || "Без имени"}
            </Link>
          </div>

          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="text-gray-900">{lead.psychologist.email}</p>
          </div>

          {lead.psychologist.slug && (
            <div>
              <p className="text-sm text-gray-500">Страница</p>
              <Link
                href={`/catalog/${lead.psychologist.slug}`}
                className="text-[#5858E2] hover:underline"
                target="_blank"
              >
                /catalog/{lead.psychologist.slug}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Действия */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Действия</h2>

        <div className="flex flex-wrap gap-3">
          {/* Написать психологу - получаем ID диалога */}
          <WriteToPsychologistButton psychologistId={lead.psychologist.id} />

          {/* Пометить подозрительным - используем client component с кнопкой */}
          {!lead.isSuspicious && (
            <SuspiciousButton leadId={lead.id} />
          )}

          {/* Теневой бан клиента */}
          {!lead.client.isShadowBanned && (
            <ShadowBanButton clientId={lead.clientId} />
          )}
        </div>
      </div>
    </div>
  );
}