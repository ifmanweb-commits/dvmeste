"use client";

import { DashboardData } from "@/lib/actions/account-dashboard";
import Link from "next/link";

interface DashboardClientProps {
  data: DashboardData;
  isPublished: boolean;
  status: string;
  certificationLevel: number;
}

const monthNames = [
  "январь", "февраль", "март", "апрель", "май", "июнь",
  "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"
];

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
    oldAcceptedLeads,
    articleBalance,
    unreadNotificationsCount,
    unreadMessagesCount,
    hasActiveDialog,
  } = data;

  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11
  const currentYear = now.getFullYear();

  // Вычисляем разницу в месяцах для баланса статей
  let monthsDiff = 0;
  if (articleBalance.lastCreditedMonth !== null && articleBalance.lastCreditedYear !== null) {
    monthsDiff = (articleBalance.lastCreditedYear - currentYear) * 12 + 
                 (articleBalance.lastCreditedMonth - 1 - currentMonth);
  } else {
    monthsDiff = -1;
  }

  return (
    <div className="space-y-6">
      {/* Плашка статуса публикации */}
      {status === "ACTIVE" && (
        <div className={`p-4 rounded-lg border ${
          isPublished 
            ? "bg-green-50 border-green-200 text-green-800" 
            : "bg-red-50 border-red-200 text-red-800"
        }`}>
          <div className="flex items-center gap-2">
            {isPublished ? (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Вы отображаетесь в каталоге</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Вы не отображаетесь в каталоге</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Верхние карточки */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Всего заявок / Принято */}
        <Link href="/account/leads">
          <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Всего / Принято</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalLeadsCount} / {acceptedLeadsCount}
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>
        </Link>

        {/* Новые заявки */}
        <Link href="/account/leads">
          <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Новые заявки</p>
                <p className="text-3xl font-bold text-gray-900">{newLeadsCount}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
        </Link>

        {/* Баланс статей */}
        <Link href="/account/articles">
          <div className={`p-5 rounded-xl border shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
            articleBalance.isCurrentMonth 
              ? "bg-emerald-50 border-emerald-100" 
              : "bg-amber-50 border-amber-100"
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Баланс статей</p>
                {articleBalance.isCurrentMonth ? (
                  <p className="text-2xl font-bold text-emerald-700">
                    Оплачено
                  </p>
                ) : (
                  <p className="text-2xl font-bold text-amber-700">
                    {articleBalance.unpaidArticlesCount ?? 0} статей
                  </p>
                )}
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                articleBalance.isCurrentMonth 
                  ? "bg-emerald-100" 
                  : "bg-amber-100"
              }`}>
                <svg className={`w-6 h-6 ${
                  articleBalance.isCurrentMonth 
                    ? "text-emerald-600" 
                    : "text-amber-600"
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            {!articleBalance.isCurrentMonth && articleBalance.lastCreditedMonth && (
              <p className="text-xs text-amber-600 mt-2">
                Последний оплаченный: {monthNames[articleBalance.lastCreditedMonth - 1]}
              </p>
            )}
          </div>
        </Link>

        {/* Уведомления */}
        <Link href="/account/notifications">
          <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Уведомления</p>
                <p className="text-3xl font-bold text-gray-900">{unreadNotificationsCount}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                )}
              </div>
            </div>
          </div>
        </Link>

        {/* Сообщения от модераторов */}
        <Link href="/account/messages">
          <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Сообщения</p>
                <p className="text-3xl font-bold text-gray-900">{unreadMessagesCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                {(unreadMessagesCount > 0 || hasActiveDialog) && (
                  <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                )}
              </div>
            </div>
            {hasActiveDialog && (
              <p className="text-xs text-green-600 mt-2">Есть непрочитанные сообщения от модераторов</p>
            )}
          </div>
        </Link>
      </div>

      {/* Старые заявки */}
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
  );
}