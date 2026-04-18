'use client'

import { useState, useEffect } from 'react'
import HorNav from '../HorNav'

type AccessLog = {
  id: string
  sessionId: string | null
  eventType: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT'
  userType: 'psychologist' | 'client' | null
  userId: string | null
  clientId: string | null
  ipAddress: string
  userAgent: string | null
  reason: string | null
  createdAt: string
  userEmail: string | null
  userName: string | null
}

type EventType = 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | ''

export default function AccessLogsPage() {
  const [logs, setLogs] = useState<AccessLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Пагинация
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Фильтры
  const [eventType, setEventType] = useState<EventType>('')
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [ipAddress, setIpAddress] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fetchLogs = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      if (eventType) params.set('eventType', eventType)
      if (email) params.set('email', email)
      if (userId) params.set('userId', userId)
      if (ipAddress) params.set('ipAddress', ipAddress)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)

      const response = await fetch(`/api/admin/access-logs?${params.toString()}`)
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Ошибка загрузки')
      }

      const data = await response.json()
      setLogs(data.logs)
      setTotalPages(data.totalPages)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [page, eventType, email, userId, ipAddress, dateFrom, dateTo])

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1) // Сбрасываем на первую страницу при новом фильтре
    fetchLogs()
  }

  const handleReset = () => {
    setEventType('')
    setEmail('')
    setUserId('')
    setIpAddress('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  const formatEventType = (type: string) => {
    const labels: Record<string, string> = {
      'LOGIN_SUCCESS': '✅ Вход успешен',
      'LOGIN_FAILED': '❌ Вход неудачен',
      'LOGOUT': '🚪 Выход'
    }
    return labels[type] || type
  }

  const formatReason = (reason: string | null) => {
    if (!reason) return null
    const labels: Record<string, string> = {
      'user_not_found': 'Пользователь не найден',
      'wrong_type': 'Неверный тип пользователя',
      'expired_token': 'Токен истёк',
      'consent_required': 'Требуется согласие'
    }
    return labels[reason] || reason
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Журнал авторизаций</h1>
        <p className="text-gray-500 mt-1">Логирование входов и выходов пользователей</p>

        {/* Вкладки */}
        <HorNav />
      </div>

      {/* Фильтры */}
      <form onSubmit={handleFilterSubmit} className="mt-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Дата от */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Дата от
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#5858E2]"
            />
          </div>

          {/* Дата до */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Дата до
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#5858E2]"
            />
          </div>

          {/* Тип события */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Тип события
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as EventType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#5858E2]"
            >
              <option value="">Все</option>
              <option value="LOGIN_SUCCESS">Вход успешен</option>
              <option value="LOGIN_FAILED">Вход неудачен</option>
              <option value="LOGOUT">Выход</option>
            </select>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#5858E2]"
            />
          </div>

          {/* IP адрес */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IP адрес
            </label>
            <input
              type="text"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              placeholder="192.168.1.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#5858E2]"
            />
          </div>

          {/* ID пользователя */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID пользователя
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="cuid..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#5858E2]"
            />
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex gap-2 mt-4">
          <button
            type="submit"
            className="px-4 py-2 bg-[#5858E2] text-white rounded-md text-sm font-medium hover:bg-[#5858E2]/90 transition-colors"
          >
            Применить
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Сбросить
          </button>
        </div>
      </form>

      {/* Результаты */}
      <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Записи ({total} всего)
          </h2>
          <span className="text-sm text-gray-500">
            Страница {page} из {totalPages}
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#5858E2]"></div>
            <p className="mt-2 text-gray-500">Загрузка...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700">
            ❌ {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Нет записей для отображения
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Дата/Время</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Событие</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">ID</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Пользователь</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Тип</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">IP адрес</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Причина</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900 whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-900">{formatEventType(log.eventType)}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {log.userId || log.clientId || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {log.userName ? (
                        <div className="font-medium text-gray-900">{log.userName}</div>
                      ) : null}
                      {log.userEmail ? (
                        <div className="text-gray-500 text-xs">{log.userEmail}</div>
                      ) : (
                        <div className="text-gray-400 text-xs">—</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {log.userType === 'psychologist' ? 'Психолог' : 
                       log.userType === 'client' ? 'Клиент' : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                      {log.ipAddress}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatReason(log.reason) || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Пагинация */}
        {!loading && !error && logs.length > 0 && (
          <div className="p-4 border-t border-gray-200 flex justify-between items-center">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Назад
            </button>
            <span className="text-sm text-gray-500">
              Страница {page} из {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Вперёд →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}