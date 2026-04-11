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
}

const moderationItems = [
  { key: "profiles" as const, label: "Профили", href: "/admin/moderation/profiles" },
  { key: "documents" as const, label: "Документы", href: "/admin/moderation/documents" },
  { key: "photos" as const, label: "Фото профилей", href: "/admin/moderation/photos" },
  { key: "articles" as const, label: "Статьи", href: "/admin/moderation/articles" },
  { key: "unreadMessages" as const, label: "Требуют ответа", href: "/admin/messages" },
  { key: "psychologistComplaints" as const, label: "Жалобы на психологов", href: "/admin/complaints/psychologists" },
  { key: "withdrawalRequests" as const, label: "Заявки на вывод", href: "/admin/withdrawal-requests" },
];

export function ModerationCards({ data }: ModerationCardsProps) {
  const hasAnyModeration = moderationItems.some(item => data[item.key] > 0);

  if (!hasAnyModeration) {
    return null;
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
      <h2 className="text-lg font-semibold text-red-900 mb-4">
        ❗ Важно
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {moderationItems.map((item) => {
          const count = data[item.key];
          if (count === 0) return null;

          return (
            <a
              key={item.key}
              href={item.href}
              className="bg-white border border-red-200 rounded-lg p-4 hover:bg-red-50 transition-colors group"
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
  );
}