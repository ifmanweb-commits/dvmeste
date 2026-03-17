import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/session"
import { NotificationsClient } from "./NotificationsClient"
import { getNotifications } from "@/lib/notifications/actions"

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

        <NotificationsClient 
          initialData={result.success ? result.data : null}
        />
      </div>
    </div>
  )
}
