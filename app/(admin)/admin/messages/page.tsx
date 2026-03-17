import { getModerDialogs } from "./actions"
import { DialogsTables } from "./DialogsTables"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/session"

export default async function AdminMessagesPage() {
  const user = await getCurrentUser()

  if (!user || (!user.isAdmin && !user.isManager)) {
    redirect("/admin")
  }

  const result = await getModerDialogs(1)

  if (!result.success) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {result.error || "Ошибка при загрузке диалогов"}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Сообщения психологов</h1>
        <p className="text-gray-500 mt-1">Управление диалогами и ответы на вопросы</p>
      </div>

      <DialogsTables initialData={result.data!} />
    </div>
  )
}