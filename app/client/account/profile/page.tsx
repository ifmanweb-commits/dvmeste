'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User } from 'lucide-react'

interface Client {
  id: string
  email: string
  name: string | null
  phone: string | null
  vk: string | null
}

export default function ClientProfilePage() {
  const [client, setClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    vk: ''
  })

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await fetch('/api/client/account/me')
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/client/auth/login')
            return
          }
          throw new Error('Ошибка загрузки')
        }
        const data = await res.json()
        setClient(data)
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
          vk: data.vk || ''
        })
      } catch (error) {
        console.error('Error fetching client:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchClient()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/client/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        throw new Error('Ошибка сохранения')
      }

      setSuccess('Профиль успешно обновлен')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ошибка сохранения')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Кнопка "Назад" и заголовок */}
      <div className="mb-6">
        <Link
          href="/client/account"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-2"
        >
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Назад
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Редактирование профиля</h1>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={client?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">Email нельзя изменить</p>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Имя
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ваше имя"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Телефон
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+7 (999) 000-00-00"
              />
            </div>

            <div>
              <label htmlFor="vk" className="block text-sm font-medium text-gray-700 mb-1">
                ВКонтакте
              </label>
              <input
                id="vk"
                type="text"
                value={formData.vk}
                onChange={(e) => setFormData({ ...formData, vk: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="id123456 или ссылка на профиль"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="text-green-600 text-sm bg-green-50 p-3 rounded">
                {success}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <Link
                href="/client/account"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Отмена
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}