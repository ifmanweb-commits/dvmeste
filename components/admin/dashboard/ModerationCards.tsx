"use client"

import { useState } from "react"

interface ModerationData {
  profiles: number;
  documents: number;
  photos: number;
  articles: number;
  unreadMessages: number;
  psychologistComplaints: number;
  withdrawalRequests: number;
}

interface ModerationCardsProps {
  data: ModerationData;
  isAdmin: boolean;
  isManager: boolean;
}

const moderationItems = [
  { key: "profiles" as const, label: "Профили", href: "/admin/moderation/profiles" },
  { key: "documents" as const, label: "Документы", href: "/admin/moderation/documents" },
  { key: "photos" as const, label: "Фото профилей", href: "/admin/moderation/photos" },
  { key: "articles" as const, label: "Статьи", href: "/admin/moderation/articles" },
  { key: "unreadMessages" as const, label: "Требуют ответа", href: "/admin/messages" },
  { key: "psychologistComplaints" as const, label: "Жалобы на психологов", href: "/admin/complaints/psychologists" },
  { key: "withdrawalRequests" as const, label: "Заявки на вывод", href: "/admin/withdrawal-requests", forManager: true },
];

export function ModerationCards({ data, isAdmin, isManager }: ModerationCardsProps) {
  const [showManagerModal, setShowManagerModal] = useState(false);

  const hasAnyModeration = moderationItems.some(item => {
    // Для заявок на вывод: показываем админам всегда, менеджерам тоже показываем
    if (item.key === "withdrawalRequests") {
      return data[item.key] > 0;
    }
    return data[item.key] > 0;
  });

  if (!hasAnyModeration) {
    return null;
  }

  const handleWithdrawalClick = (e: React.MouseEvent, isForManager: boolean) => {
    if (isForManager && !isAdmin) {
      e.preventDefault();
      setShowManagerModal(true);
    }
  };

  return (
    <>
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-red-900 mb-4">
          ❗ Важно
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {moderationItems.map((item) => {
            const isForManager = item.forManager;
            const isWithdrawal = item.key === "withdrawalRequests";
            
            // Скрываем заявки на вывод от тех, кто не админ и не менеджер
            if (isWithdrawal && !isAdmin && !isManager) return null;
            
            const count = data[item.key];
            if (count === 0) return null;

            const isManagerRestricted = Boolean(isForManager && !isAdmin);

            return (
              <a
                key={item.key}
                href={item.href}
                onClick={(e) => handleWithdrawalClick(e, isManagerRestricted)}
                className={`bg-white border border-red-200 rounded-lg p-4 hover:bg-red-50 transition-colors group ${
                  isManagerRestricted ? "cursor-pointer" : ""
                }`}
              >
                <div className="text-2xl font-bold text-red-600 group-hover:text-red-700">
                  {count}
                </div>
                <div className="text-sm text-red-800 mt-1">
                  {item.label}
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* Модальное окно для менеджеров */}
      {showManagerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Информация</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Есть заявки на вывод денег, проинформируйте администратора
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowManagerModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}