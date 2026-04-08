'use client'

import { useState, useId } from 'react'
import { grantAccess } from '../actions'
import { getCurrentUser } from '@/lib/auth/session'

interface GrantAccessModalProps {
  secretPages: { id: string; title: string; slug: string }[]
  adminId: string
}

export default function GrantAccessModal({ secretPages, adminId }: GrantAccessModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    setError(null)

    // Добавляем adminId из пропсов
    formData.set('adminId', adminId)

    const result = await grantAccess(formData)

    if (result.error) {
      setError(result.error)
      setIsSubmitting(false)
    } else {
      setIsOpen(false)
      window.location.reload()
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]"
      >
        + Выдать доступ
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Затемнение фона */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setIsOpen(false)}
      />

      {/* Модалка */}
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Выдать доступ</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form action={handleSubmit} className="space-y-4">
          {/* Email пользователя */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email пользователя <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              id="email"
              required
              placeholder="user@example.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
            />
            <p className="mt-1 text-xs text-gray-500">
              Поиск по полному email (используется хэш)
            </p>
          </div>

          {/* Тип ресурса (фиксированный) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Тип ресурса
            </label>
            <input
              type="text"
              value="Секретная страница"
              disabled
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-100 text-gray-500"
            />
            <input type="hidden" name="resourceType" value="page" />
          </div>

          {/* Выбор ресурса */}
          <div>
            <label htmlFor="resourceId" className="block text-sm font-medium text-gray-700 mb-1">
              Секретная страница <span className="text-red-500">*</span>
            </label>
            <select
              name="resourceId"
              id="resourceId"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
            >
              <option value="">Выберите страницу</option>
              {secretPages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.title}
                </option>
              ))}
            </select>
          </div>

          {/* Срок действия */}
          <div>
            <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700 mb-1">
              Срок действия (опционально)
            </label>
            <input
              type="datetime-local"
              name="expiresAt"
              id="expiresAt"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
            />
          </div>

          {/* Скрытое поле для adminId */}
          <input type="hidden" name="adminId" value={adminId} />
          {!adminId && (
            <p className="text-xs text-red-500">Ошибка: ID администратора не найден</p>
          )}

          {/* Ошибка */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Кнопки */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9] disabled:opacity-50"
            >
              {isSubmitting ? 'Выдача...' : 'Выдать'}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}