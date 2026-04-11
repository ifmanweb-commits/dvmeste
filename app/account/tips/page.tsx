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
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Подсказки
          </h1>
        </header>

        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            История просмотров
          </h2>
        
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

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
        </section>
      </div>
    </div>
  )
}