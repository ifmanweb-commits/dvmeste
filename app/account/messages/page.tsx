// app/account/messages/page.tsx
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/session"
import { MessagesClient } from "./MessagesClient"

export default async function MessagesPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  if (user.status === "BLOCKED") {
    redirect("/account?blocked=true")
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Сообщения модераторам</h1>
        <p className="text-gray-500 mt-2">
          Здесь вы можете задать вопросы модераторам и получить ответы
        </p>
      </div>

      <MessagesClient />
    </div>
  )
}