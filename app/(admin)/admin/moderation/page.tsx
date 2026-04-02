import Link from "next/link";

interface ModerationCardProps {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

function ModerationCard({ href, title, description, icon }: ModerationCardProps) {
  return (
    <Link
      href={href}
      className="group block rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-[#5858E2]/30 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#5858E2]/10 text-[#5858E2] group-hover:bg-[#5858E2] group-hover:text-white transition-colors">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 group-hover:text-[#5858E2] transition-colors">
            {title}
          </h3>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </Link>
  );
}

export default function ModerationPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Модерация</h1>
      
      <div className="grid gap-4 sm:grid-cols-2">
        <ModerationCard
          href="/admin/moderation/profiles"
          title="Модерация профилей"
          description="Проверка анкет психологов"
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />
        
        <ModerationCard
          href="/admin/moderation/articles"
          title="Модерация статей"
          description="Проверка публикаций и контента"
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-9-3h10" />
            </svg>
          }
        />
        
        <ModerationCard
          href="/admin/moderation/photos"
          title="Модерация фото"
          description="Проверка фотографий пользователей"
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        
        <ModerationCard
          href="/admin/moderation/documents"
          title="Модерация документов"
          description="Проверка дипломов и сертификатов"
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
      </div>
    </div>
  );
}