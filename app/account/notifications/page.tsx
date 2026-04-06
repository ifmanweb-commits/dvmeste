import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/session"
import { NotificationsClient } from "./NotificationsClient"
import { getNotifications } from "@/lib/notifications/actions"
import Link from "next/link"
import { Bell, Monitor, MessageCircle } from "lucide-react"

export default async function NotificationsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  const result = await getNotifications(1, 20)

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
                className="inline-flex items-center gap-2 border-b-2 border-slate-900 pb-3 text-sm font-medium text-slate-900"
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
                className="inline-flex items-center gap-2 border-b-2 border-transparent pb-3 text-sm font-medium text-slate-500 hover:text-slate-700"
              >
                <MessageCircle className="h-4 w-4" />
                Вконтакте
              </Link>
            </li>
          </ul>
        </nav>

        <NotificationsClient 
          initialData={result.success ? result.data : null}
        />
      </div>
    </div>
  )
}
