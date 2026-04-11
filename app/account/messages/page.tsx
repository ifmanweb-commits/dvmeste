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
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Сообщения модераторам
          </h1>
          <p className="text-gray-600">
            Здесь вы можете задать вопросы модераторам и получить ответы
          </p>
        </header> 
      

        <MessagesClient userAvatar={user.avatarUrl} />
      </div>
    </div>
  )
}