import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/session"
import { PushClient } from "./PushClient"
import { getPushStatus, getUserSubscriptions } from "@/lib/actions/push"
import Link from "next/link"
import { Bell, Monitor, MessageCircle } from "lucide-react"

export default async function PushPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  const statusResult = await getPushStatus()
  const subscriptionsResult = await getUserSubscriptions()

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Уведомления
          </h1>
          <p className="text-gray-600">
            Будьте в курсе всех событий вашего профиля
          </p>
        </header>

        {/* Горизонтальное меню */}
        <nav className="mb-6 border-b border-gray-200">
          <ul className="flex flex-wrap gap-4 sm:gap-6">
            <li>
              <Link
                href="/account/notifications"
                className="inline-flex items-center gap-2 border-b-2 border-transparent pb-3 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                <Bell className="h-4 w-4" />
                Системные
              </Link>
            </li>
            <li>
              <Link
                href="/account/push"
                className="inline-flex items-center gap-2 border-b-2 border-[#5858E2] pb-3 text-sm font-medium text-[#5858E2]"
              >
                <Monitor className="h-4 w-4" />
                В&nbsp;браузере
              </Link>
            </li>
            <li>
              <Link
                href="/account/notifications/vk"
                className="inline-flex items-center gap-2 border-b-2 border-transparent pb-3 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                <MessageCircle className="h-4 w-4" />
                Вконтакте
              </Link>
            </li>
          </ul>
        </nav>

        <PushClient
          initialSubscribed={statusResult.success ? statusResult.subscribed : false}
          initialSubscriptions={subscriptionsResult.success ? subscriptionsResult.data : []}
        />
      </div>
    </div>
  )
}
