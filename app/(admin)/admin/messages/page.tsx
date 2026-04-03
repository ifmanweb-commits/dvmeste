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
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Сообщения психологов</h1>
          <p className="text-gray-500 mt-1">Модерация диалогов с клиентами</p>
        </div>
        <div className="text-sm text-gray-500">
          Требуют ответа: {result.data!.active.length}
        </div>
      </div>

      <DialogsTables initialData={result.data!} />
    </div>
  )
}