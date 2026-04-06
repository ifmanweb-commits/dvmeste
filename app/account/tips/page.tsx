import { getUserTipsHistory } from "@/lib/actions/onboarding"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ExternalLink } from "lucide-react"
import TipsTable from "./TipsTable"

interface TipHistoryItem {
  id: string
  title: string
  message: string
  type: "TOAST" | "MODAL"
  pageUrl: string
  delaySeconds: number
  dismissedAt: Date
}

export default async function TipsPage() {
  const result = await getUserTipsHistory()
  
  if (!result.success) {
    redirect("/auth/login")
  }
  
  const tips: TipHistoryItem[] = result.data

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-gray-900 sm:text-2xl">
            Подсказки
          </h1>
          <Link
            href="/account"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Назад в дашборд
          </Link>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              История просмотров
            </h2>
          </div>

          {tips.length === 0 ? (
            <div className="p-6">
              <p className="text-center text-sm text-gray-500">
                Вы ещё не закрывали ни одной подсказки
              </p>
            </div>
          ) : (
            <TipsTable tips={tips} />
          )}
        </div>
      </div>
    </div>
  )
}