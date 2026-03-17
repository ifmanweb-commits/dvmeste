import { getDialogDetail, sendModerMessage } from "../actions"
import { MessageThread } from "../MessageThread"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/session"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

type Props = {
  params: Promise<{ dialogId: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function AdminDialogPage({ params, searchParams }: Props) {
  const user = await getCurrentUser()
  const { dialogId } = await params
  const { page } = await searchParams
  const currentPage = page ? parseInt(page) : 1

  if (!user || (!user.isAdmin && !user.isManager)) {
    redirect("/admin")
  }

  const result = await getDialogDetail(dialogId, currentPage)

  if (!result.success) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {result.error || "Ошибка при загрузке диалога"}
        </div>
        <Link
          href="/admin/messages"
          className="inline-flex items-center gap-2 text-sm text-[#5858E2] hover:text-[#4b4bcf] mt-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад к списку диалогов
        </Link>
      </div>
    )
  }

  const { dialog, messages, pagination } = result.data!

  return (
    <div className="p-6">
      {/* Шапка */}
      <div className="mb-6">
        <Link
          href="/admin/messages"
          className="inline-flex items-center gap-2 text-sm text-[#5858E2] hover:text-[#4b4bcf] mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад к списку диалогов
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {dialog.user.fullName || "Без имени"}
            </h1>
            <p className="text-gray-500 mt-1">{dialog.user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              dialog.status === "ACTIVE"
                ? "bg-red-100 text-red-700"
                : dialog.status === "WAITING"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-gray-100 text-gray-700"
            }`}>
              {dialog.status === "ACTIVE" && "Требует ответа"}
              {dialog.status === "WAITING" && "Ожидает пользователя"}
              {dialog.status === "ARCHIVED" && "Архив"}
            </span>
          </div>
        </div>
      </div>

      {/* Лента сообщений */}
      <MessageThread
        dialogId={dialogId}
        initialMessages={messages}
        initialPagination={pagination}
        sendMessageAction={sendModerMessage}
      />
    </div>
  )
}