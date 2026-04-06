import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/session"
import Link from "next/link"
import { Bell, Monitor, MessageCircle } from "lucide-react"

export default async function VkNotificationsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-slate-50/30">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">
            Уведомления
          </h1>
          <p className="text-slate-500">
            Будьте в курсе всех событий вашего профиля
          </p>
        </header>

        {/* Горизонтальное меню */}
        <nav className="mb-8 border-b border-slate-200">
          <ul className="flex gap-6">
            <li>
              <Link
                href="/account/notifications"
                className="inline-flex items-center gap-2 border-b-2 border-transparent pb-3 text-sm font-medium text-slate-500 hover:text-slate-700"
              >
                <Bell className="h-4 w-4" />
                Системные
              </Link>
            </li>
            <li>
              <Link
                href="/account/push"
                className="inline-flex items-center gap-2 border-b-2 border-transparent pb-3 text-sm font-medium text-slate-500 hover:text-slate-700"
              >
                <Monitor className="h-4 w-4" />
                В браузере
              </Link>
            </li>
            <li>
              <Link
                href="/account/notifications/vk"
                className="inline-flex items-center gap-2 border-b-2 border-slate-900 pb-3 text-sm font-medium text-slate-900"
              >
                <MessageCircle className="h-4 w-4" />
                Вконтакте
              </Link>
            </li>
          </ul>
        </nav>

        {/* Заглушка */}
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <MessageCircle className="mx-auto h-14 w-14 text-slate-300" />
          <h3 className="mt-4 text-lg font-medium text-slate-900">
            В разработке
          </h3>
          <p className="mt-2 text-slate-500">
            Уведомления ВКонтакте скоро будут доступны
          </p>
        </div>
      </div>
    </div>
  )
}