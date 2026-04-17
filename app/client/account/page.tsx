'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Users, FileText, Search } from 'lucide-react'

async function handleLogout() {
  await fetch('/api/client/auth/logout', { method: 'POST' })
}

interface Client {
  id: string
  email: string
  name: string | null
  phone: string | null
  vk: string | null
}

export default function ClientAccountPage() {
  const [client, setClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

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
      } catch (error) {
        console.error('Error fetching client:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchClient()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    )
  }

  if (!client) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Профиль */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Профиль</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-500">Email</label>
            <p className="text-gray-900">{client.email}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Имя</label>
            <p className="text-gray-900">{client.name || 'Не указано'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Телефон</label>
            <p className="text-gray-900">{client.phone || 'Не указано'}</p>
          </div>
        </div>
        <Link 
          href="/client/account/profile"
          className="mt-4 block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Редактировать профиль →
        </Link>
      </div>

      {/* Заявки */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Мои заявки</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          История ваших заявок к психологам
        </p>
        <Link 
          href="/client/account/leads"
          className="block text-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Посмотреть заявки
        </Link>
      </div>

      {/* Психологи */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Search className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Найти психолога</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Каталог специалистов
        </p>
        <Link 
          href="/catalog"
          className="block text-center bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
        >
          Перейти в каталог
        </Link>
      </div>
    </div>
  )
}