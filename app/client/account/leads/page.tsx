'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Inbox } from 'lucide-react'

interface Lead {
  id: string
  createdAt: string
  message?: string | null
  psychologist: {
    id: string
    name: string
    slug: string | null
    photo: string | null
  }
}

export default function ClientLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const res = await fetch('/api/client/account/leads')
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/auth/login')
            return
          }
          throw new Error('Ошибка загрузки')
        }
        const data = await res.json()
        setLeads(data)
      } catch (error) {
        console.error('Error fetching leads:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeads()
  }, [router])

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
        <h1 className="text-2xl font-bold text-gray-900">Мои заявки</h1>
      </div>

      {leads.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="flex justify-center mb-4">
            <Inbox className="h-12 w-12 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">У вас пока нет заявок</h2>
          <p className="text-gray-500 mb-6">
            Выберите психолога в каталоге и оставьте заявку
          </p>
          <Link
            href="/catalog"
            className="inline-block bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors"
          >
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Левая часть: дата и текст заявки */}
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-2">
                    {new Date(lead.createdAt).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                  {lead.message && (
                    <p className="text-gray-700 text-sm">
                      {lead.message}
                    </p>
                  )}
                </div>
                
                {/* Правая часть: аватар и имя психолога */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    {lead.psychologist.slug ? (
                      <Link
                        href={`/catalog/${lead.psychologist.slug}`}
                        className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {lead.psychologist.name}
                      </Link>
                    ) : (
                      <span className="font-semibold text-gray-900">
                        {lead.psychologist.name}
                      </span>
                    )}
                  </div>
                  {lead.psychologist.photo ? (
                    <img
                      src={lead.psychologist.photo}
                      alt={lead.psychologist.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-400 text-xl">👤</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}