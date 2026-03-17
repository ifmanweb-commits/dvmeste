"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Archive, RefreshCw } from "lucide-react"
import { DialogStatus } from "@prisma/client"

type DialogRowProps = {
  dialog: {
    id: string
    status: DialogStatus
    lastMessageAt: Date
    user: {
      id: string
      fullName: string | null
      email: string
    }
    lastMessage: {
      text: string
      createdAt: Date
      direction: "to_moder" | "to_user"
    } | null
  }
  showArchiveButton?: boolean
  showUnarchiveButton?: boolean
  onArchive?: (dialogId: string) => Promise<void>
  onUnarchive?: (dialogId: string) => Promise<void>
}

const statusConfig = {
  ACTIVE: { color: "bg-red-500", label: "Требует ответа" },
  WAITING: { color: "bg-yellow-500", label: "Ожидает пользователя" },
  ARCHIVED: { color: "bg-gray-400", label: "Архив" }
}

export function DialogRow({ 
  dialog, 
  showArchiveButton = false,
  showUnarchiveButton = false,
  onArchive,
  onUnarchive
}: DialogRowProps) {
  const router = useRouter()
  const status = statusConfig[dialog.status]

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const handleArchive = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onArchive) {
      await onArchive(dialog.id)
      router.refresh()
    }
  }

  const handleUnarchive = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onUnarchive) {
      await onUnarchive(dialog.id)
      router.refresh()
    }
  }

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      {/* Индикатор статуса */}
      <td className="px-4 py-3 w-4">
        <div className={`w-3 h-3 rounded-full ${status.color}`} title={status.label} />
      </td>

      {/* Имя психолога */}
      <td className="px-4 py-3">
        <Link 
          href={`/admin/messages/${dialog.id}`}
          className="font-medium text-gray-900 hover:text-[#5858E2] transition-colors"
        >
          {dialog.user.fullName || "Без имени"}
          <div className="text-xs text-gray-500">{dialog.user.email}</div>
        </Link>
      </td>

      {/* Последнее сообщение */}
      <td className="px-4 py-3">
        <Link 
          href={`/admin/messages/${dialog.id}`}
          className="text-sm text-gray-600 hover:text-[#5858E2] transition-colors"
        >
          {dialog.lastMessage ? (
            <>
              <span className="text-xs text-gray-400 mr-2">
                {dialog.lastMessage.direction === "to_moder" ? "←" : "→"}
              </span>
              {dialog.lastMessage.text}
            </>
          ) : (
            <span className="text-gray-400 italic">Нет сообщений</span>
          )}
        </Link>
      </td>

      {/* Дата последнего обновления */}
      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
        {formatDate(dialog.lastMessageAt)}
      </td>

      {/* Кнопка действия */}
      <td className="px-4 py-3 text-right">
        {showArchiveButton && (
          <button
            onClick={handleArchive}
            className="p-2 text-gray-400 hover:text-[#5858E2] transition-colors"
            title="В архив"
          >
            <Archive className="h-4 w-4" />
          </button>
        )}
        {showUnarchiveButton && (
          <button
            onClick={handleUnarchive}
            className="p-2 text-gray-400 hover:text-[#5858E2] transition-colors"
            title="Вернуть из архива"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
      </td>
    </tr>
  )
}