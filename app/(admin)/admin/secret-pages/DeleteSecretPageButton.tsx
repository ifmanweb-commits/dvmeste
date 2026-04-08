'use client'

import { useState } from 'react'
import { deleteSecretPage } from './actions'

interface DeleteSecretPageButtonProps {
  pageId: string
}

export default function DeleteSecretPageButton({ pageId }: DeleteSecretPageButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить эту страницу? Все файлы будут удалены.')) {
      return
    }

    setIsDeleting(true)
    await deleteSecretPage(pageId)
    setIsDeleting(false)
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-200 disabled:opacity-50"
    >
      {isDeleting ? 'Удаление...' : 'Удалить'}
    </button>
  )
}