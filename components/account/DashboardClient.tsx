import { DashboardData } from "@/lib/actions/account-dashboard";
import Link from "next/link";
import Image from "next/image";
import { Award, CheckCircle, FileText, MessageSquare, Bell, UserCheck, TrendingUp } from "lucide-react";

interface DashboardClientProps {
  data: DashboardData;
  isPublished: boolean;
  status: string;
  certificationLevel: number;
}

const statusTranslations: Record<string, string> = {
  candidate: "Непроверенный психолог",
  active: "Проверенный психолог",
  pending: "На модерации",
  rejected: "Отклонён",
  blocked: "Заблокирован",
};

export default function DashboardClient({
  data,
  isPublished,
  status,
  certificationLevel,
}: DashboardClientProps) {
  const {
    newLeadsCount,
    totalLeadsCount,
    acceptedLeadsCount,
    totalAcceptedLeadsCount,
    oldAcceptedLeads,
    articleBalance,
    unreadNotificationsCount,
    unreadMessagesCount,
    hasActiveDialog,
    awards,
    submittedArticlesCount,
    publishedArticlesCount,
  } = data;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Левая колонка: основные блоки */}
      <div className="flex-1 space-y-6">
        {/* Блок 1: Профиль психолога */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Профиль психолога</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Статус */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-500">Статус</span>
              </div>
              <p className="text-lg font-medium text-gray-900">
                {statusTranslations[status.toLowerCase()] || status}
              </p>
            </div>

            {/* Уровень квалификации */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-500">Уровень квалификации</span>
              </div>
              <p className="text-lg font-medium text-gray-900">
                Уровень {certificationLevel}
              </p>
            </div>

            {/* Размещение в каталоге */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-500">Каталог</span>
              </div>
              <p className={`text-lg font-medium ${isPublished ? 'text-green-600' : 'text-red-600'}`}>
                {isPublished ? 'Разрешено размещение в каталоге' : 'Размещение в каталоге пока не разрешено'}
              </p>
            </div>
          </div>
        </div>

        {/* Блок 3: Заявки */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Заявки</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/account/leads" className="p-4 bg-indigo-50 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors">
              <p className="text-sm text-indigo-600 mb-1">Всего заявок</p>
              <p className="text-3xl font-bold text-indigo-900">{totalLeadsCount}</p>
            </Link>
            <Link href="/account/leads" className="p-4 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 transition-colors">
              <p className="text-sm text-green-600 mb-1">Активные</p>
              <p className="text-3xl font-bold text-green-900">{acceptedLeadsCount}</p>
            </Link>
            <Link href="/account/leads" className="p-4 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
              <p className="text-sm text-blue-600 mb-1">Было принято</p>
              <p className="text-3xl font-bold text-blue-900">{totalAcceptedLeadsCount}</p>
            </Link>
            {newLeadsCount > 0 && (
              <Link href="/account/leads" className="p-4 bg-amber-50 rounded-lg border border-amber-100 hover:bg-amber-100 transition-colors">
                <p className="text-sm text-amber-600 mb-1">Новые заявки</p>
                <p className="text-3xl font-bold text-amber-900">{newLeadsCount}</p>
              </Link>
            )}
          </div>
        </div>

        {/* Блок 4: Уведомления и сообщения */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/account/notifications" className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Уведомления</h2>
              <Bell className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-4xl font-bold text-gray-900">{unreadNotificationsCount}</p>
            <p className="text-sm text-gray-500 mt-1">непрочитанных уведомлений</p>
          </Link>

          <Link href="/account/messages" className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Сообщения</h2>
              <MessageSquare className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-4xl font-bold text-gray-900">{unreadMessagesCount}</p>
            <p className="text-sm text-gray-500 mt-1">непрочитанных сообщений</p>
          </Link>
        </div>

        {/* Блок 5: Статьи */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Статьи</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/account/articles" className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-500">Сдано статей</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{submittedArticlesCount}</p>
            </Link>
            <Link href="/account/articles" className="p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-500">Опубликовано</span>
              </div>
              <p className="text-3xl font-bold text-green-900">{publishedArticlesCount}</p>
            </Link>
            <Link href="/account/articles" className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-emerald-500" />
                <span className="text-sm text-emerald-500">Баллов</span>
              </div>
              <p className="text-3xl font-bold text-emerald-900">
                {articleBalance.totalBonus}
              </p>
            </Link>
          </div>
        </div>

        {/* Старые заявки (если есть) */}
        {oldAcceptedLeads.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Заявки, требующие завершения
            </h3>
            <div className="space-y-3">
              {oldAcceptedLeads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/account/leads/${lead.id}`}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {lead.clientName || "Клиент"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Принята {lead.daysSinceAccept} дн. назад
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Правая колонка: Награды */}
      {awards.length > 0 && (
        <div className="lg:w-80 xl:w-96">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Полученные награды</h2>
            <div className="flex flex-col gap-4">
              {awards.map((award) => (
                <div
                  key={award.id}
                  className="p-2 hover:shadow-md transition-shadow"
                >
                  {/* Изображение награды */}
                  <div className="h-40 rounded-md bg-gray-50 flex items-center justify-center mb-2 overflow-hidden">
                    {award.rewardType === 'certificate' && award.certificateImageUrl ? (
                      <Image
                        src={award.certificateImageUrl}
                        alt={award.certificationTitle}
                        width={160}
                        height={120}
                        className="object-contain"
                      />
                    ) : award.badgeUrl ? (
                      <Image
                        src={award.badgeUrl}
                        alt={award.certificationTitle}
                        width={80}
                        height={80}
                        className="object-contain"
                      />
                    ) : (
                      <Award className="w-10 h-10 text-gray-400" />
                    )}
                  </div>
                  {/* Год получения */}
                  <p className="text-center text-xs text-gray-500">
                    {new Date(award.awardedAt).getFullYear()}
                  </p>
                  {/* Название награды */}
                  <p className="text-center text-sm font-medium text-gray-900 truncate">
                    {award.certificationTitle}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}