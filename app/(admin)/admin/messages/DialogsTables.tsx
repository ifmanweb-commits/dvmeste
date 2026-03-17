"use client"

import { useState, useEffect } from "react"
import { DialogRow } from "./DialogRow"
import { archiveDialog, unarchiveDialog, getModerDialogs } from "./actions"
import { Loader2 } from "lucide-react"
import { DialogStatus } from "@prisma/client"

type Dialog = {
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

type ArchivePagination = {
  currentPage: number
  totalPages: number
  hasMore: boolean
  total: number
}

type DialogsData = {
  active: Dialog[]
  waiting: Dialog[]
  archived: Dialog[]
  archivePagination: ArchivePagination
}

export function DialogsTables({ initialData }: { initialData: DialogsData }) {
  const [data, setData] = useState<DialogsData>(initialData)
  const [archivePage, setArchivePage] = useState(1)
  const [loadingArchive, setLoadingArchive] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Авто-рефреш активных и waiting каждую минуту
  useEffect(() => {
    const interval = setInterval(async () => {
      setRefreshing(true)
      try {
        const result = await getModerDialogs(archivePage)
        if (result.success && result.data) {
          setData(prev => ({
            ...result.data,
            archived: prev.archived // сохраняем текущий архив
          }))
        }
      } catch (error) {
        console.error("Error refreshing dialogs:", error)
      } finally {
        setRefreshing(false)
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [archivePage])

  // Загрузка архивной страницы
  const loadArchivePage = async (page: number) => {
    setLoadingArchive(true)
    try {
      const result = await getModerDialogs(page)
      if (result.success && result.data) {
        setData(prev => ({
          ...prev,
          archived: result.data.archived,
          archivePagination: result.data.archivePagination
        }))
        setArchivePage(page)
      }
    } catch (error) {
      console.error("Error loading archive page:", error)
    } finally {
      setLoadingArchive(false)
    }
  }

  const handleArchive = async (dialogId: string) => {
    await archiveDialog(dialogId)
    // Обновляем данные после архивации
    const result = await getModerDialogs(archivePage)
    if (result.success && result.data) {
      setData(result.data)
    }
  }

  const handleUnarchive = async (dialogId: string) => {
    await unarchiveDialog(dialogId)
    // Обновляем данные после возврата
    const result = await getModerDialogs(archivePage)
    if (result.success && result.data) {
      setData(result.data)
    }
  }

  const TableSection = ({ 
    title, 
    dialogs, 
    showArchiveButton = false,
    showUnarchiveButton = false,
    emptyMessage = "Нет диалогов"
  }: { 
    title: string
    dialogs: Dialog[]
    showArchiveButton?: boolean
    showUnarchiveButton?: boolean
    emptyMessage?: string
  }) => (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">{title}</h2>
      {dialogs.length > 0 ? (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-2 w-4"></th>
              <th className="px-4 py-2">Психолог</th>
              <th className="px-4 py-2">Последнее сообщение</th>
              <th className="px-4 py-2">Обновлено</th>
              <th className="px-4 py-2 text-right">Действие</th>
            </tr>
          </thead>
          <tbody>
            {dialogs.map(dialog => (
              <DialogRow
                key={dialog.id}
                dialog={dialog}
                showArchiveButton={showArchiveButton}
                showUnarchiveButton={showUnarchiveButton}
                onArchive={showArchiveButton ? handleArchive : undefined}
                onUnarchive={showUnarchiveButton ? handleUnarchive : undefined}
              />
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-400 italic py-4">{emptyMessage}</p>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Индикатор авто-рефреша */}
      {refreshing && (
        <div className="fixed top-4 right-4 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          Обновление...
        </div>
      )}

      {/* Активные диалоги */}
      <TableSection
        title="🔴 Требуют ответа"
        dialogs={data.active}
        showArchiveButton={true}
        emptyMessage="Нет активных диалогов"
      />

      {/* Ожидающие диалоги */}
      <TableSection
        title="🟡 Ожидают ответа пользователя"
        dialogs={data.waiting}
        showArchiveButton={true}
        emptyMessage="Нет ожидающих диалогов"
      />

      {/* Архивные диалоги */}
      <TableSection
        title="📦 Архив"
        dialogs={data.archived}
        showUnarchiveButton={true}
        emptyMessage="Архив пуст"
      />

      {/* Пагинация для архива */}
      {data.archivePagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Страница {archivePage} из {data.archivePagination.totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => loadArchivePage(archivePage - 1)}
              disabled={archivePage === 1 || loadingArchive}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Назад
            </button>
            <button
              onClick={() => loadArchivePage(archivePage + 1)}
              disabled={!data.archivePagination.hasMore || loadingArchive}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Вперед
            </button>
          </div>
        </div>
      )}
    </div>
  )
}