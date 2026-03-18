import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/session"
import { PushClient } from "./PushClient"
import { getPushStatus, getUserSubscriptions } from "@/lib/actions/push"

export default async function PushPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  const statusResult = await getPushStatus()
  const subscriptionsResult = await getUserSubscriptions()

  return (
    <div className="min-h-screen bg-slate-50/30">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">
            Push-уведомления
          </h1>
          <p className="text-slate-500">
            Получайте уведомления о новых событиях даже когда сайт закрыт
          </p>
        </header>

        <PushClient
          initialSubscribed={statusResult.success ? statusResult.subscribed : false}
          initialSubscriptions={subscriptionsResult.success ? subscriptionsResult.data : []}
        />
      </div>
    </div>
  )
}
