'use client'

import React, { useState, useEffect, useCallback } from 'react'
import HorNav from '../HorNav'

interface SystemLog {
  id: string
  level: string
  message: string
  stack: string | null
  source: string | null
  userId: string | null
  requestId: string | null
  url: string | null
  createdAt: string
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

const LEVEL_BADGE: Record<string, string> = {
  ERROR: 'bg-red-100 text-red-800',
  WARN: 'bg-yellow-100 text-yellow-800',
  LOG: 'bg-gray-100 text-gray-800',
  INFO: 'bg-blue-100 text-blue-800',
}

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [pagination, setPagination] = useState<PaginationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  // Фильтры
  const [level, setLevel] = useState('')
  const [source, setSource] = useState('')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  
  // Очистка
  const [showCleanupModal, setShowCleanupModal] = useState(false)
  const [cleanupDays, setCleanupDays] = useState('30')
  const [cleaning, setCleaning] = useState(false)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '100',
    })
    
    if (level) params.set('level', level)
    if (source) params.set('source', source)
    if (search) params.set('search', search)
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)
    
    try {
      const res = await fetch(`/api/admin/system-logs?${params}`)
      const json = await res.json()
      
      if (json.success) {
        setLogs(json.data.logs)
        setPagination(json.data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setLoading(false)
    }
  }, [page, level, source, search, dateFrom, dateTo])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Автообновление каждые 30 секунд
  useEffect(() => {
    const interval = setInterval(fetchLogs, 30000)
    return () => clearInterval(interval)
  }, [fetchLogs])

  const handleCleanup = async () => {
    setCleaning(true)
    
    try {
      const days = parseInt(cleanupDays, 10)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      
      const res = await fetch('/api/admin/system-logs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ olderThan: cutoffDate.toISOString() }),
      })
      
      const json = await res.json()
      
      if (json.success) {
        alert(`Удалено ${json.data.deleted} записей`)
        setShowCleanupModal(false)
        fetchLogs()
      } else {
        alert('Ошибка: ' + json.error)
      }
    } catch (error) {
      alert('Ошибка при очистке')
    } finally {
      setCleaning(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchLogs()
  }

  const handleReset = () => {
    setLevel('')
    setSource('')
    setSearch('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  // Форматирование даты для input type="datetime-local"
  const toLocalDatetime = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000
    const localDate = new Date(date.getTime() - offset)
    return localDate.toISOString().slice(0, 16)
  }

  const setToday = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    setDateFrom(toLocalDatetime(today))
    setDateTo(toLocalDatetime(now))
    setPage(1)
  }

  const setYesterday = () => {
    const now = new Date()
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
    const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    setDateFrom(toLocalDatetime(yesterday))
    setDateTo(toLocalDatetime(yesterdayEnd))
    setPage(1)
  }

  const setLastHour = () => {
    const now = new Date()
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    setDateFrom(toLocalDatetime(hourAgo))
    setDateTo(toLocalDatetime(now))
    setPage(1)
  }

  const formatMessage = (msg: string) => {
    if (msg.length > 150) {
      return msg.substring(0, 150) + '...'
    }
    return msg
  }

  const formatSource = (source: string | null) => {
    if (!source) return '—'
    const parts = source.split('/')
    return parts[parts.length - 1]
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const getFullLogText = (log: SystemLog) => {
    let text = `[${log.level}] ${formatDate(log.createdAt)}\n`
    if (log.source) text += `Source: ${log.source}\n`
    if (log.url) text += `URL: ${log.url}\n`
    if (log.userId) text += `User ID: ${log.userId}\n`
    if (log.requestId) text += `Request ID: ${log.requestId}\n`
    text += `\nMessage:\n${log.message}`
    if (log.stack) text += `\n\nStack trace:\n${log.stack}`
    return text
  }

  const handleCopyLog = async (log: SystemLog, e: React.MouseEvent) => {
    e.stopPropagation()
    const text = getFullLogText(log)
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(log.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopiedId(log.id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Системные логи</h1>
        <p className="text-gray-500 mt-1">Технические логи приложения (console.log/error/warn)</p>

        <HorNav />
      </div>

      {/* Фильтры */}
      <form onSubmit={handleSearch} className="mt-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Уровень</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#5858E2]"
            >
              <option value="">Все</option>
              <option value="ERROR">ERROR</option>
              <option value="WARN">WARN</option>
              <option value="LOG">LOG</option>
              <option value="INFO">INFO</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Источник</label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="route.ts"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#5858E2]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Поиск</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Текст сообщения..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#5858E2]"
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Дата от</label>
              <div className="flex gap-1">
                <button type="button" onClick={setLastHour} className="text-xs text-[#5858E2] hover:text-[#4a4ac7] cursor-pointer">Час</button>
                <button type="button" onClick={setToday} className="text-xs text-[#5858E2] hover:text-[#4a4ac7] cursor-pointer">Сегодня</button>
                <button type="button" onClick={setYesterday} className="text-xs text-[#5858E2] hover:text-[#4a4ac7] cursor-pointer">Вчера</button>
              </div>
            </div>
            <input
              type="datetime-local"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#5858E2]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Дата до</label>
            <input
              type="datetime-local"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#5858E2]"
            />
          </div>
        </div>
        
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
            Записи ({pagination?.total || 0} всего)
          </h2>
          <span className="text-sm text-gray-500">
            {pagination ? `Страница ${pagination.page} из ${pagination.totalPages}` : ''}
          </span>
          <button
            onClick={() => setShowCleanupModal(true)}
            className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm font-medium hover:bg-red-100 transition-colors"
          >
            Очистить логи
          </button>
        </div>
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#5858E2]"></div>
            <p className="mt-2 text-gray-500">Загрузка...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Нет записей для отображения</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Время</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Уровень</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Сообщение</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Источник</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">URL</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr
                      className={`cursor-pointer hover:bg-gray-50 ${expandedLog === log.id ? 'bg-gray-50' : ''}`}
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    >
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${LEVEL_BADGE[log.level] || LEVEL_BADGE.LOG}`}>
                          {log.level}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-md">
                        <span className={log.level === 'ERROR' ? 'text-red-600' : log.level === 'WARN' ? 'text-yellow-600' : 'text-gray-700'}>
                          {formatMessage(log.message)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {formatSource(log.source)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {log.url ? new URL(log.url).pathname : '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={(e) => handleCopyLog(log, e)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title="Копировать лог"
                        >
                          {copiedId === log.id ? (
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </td>
                    </tr>
                    {/* Inline details row */}
                    {expandedLog === log.id && (
                      <tr className="bg-gray-50">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-gray-900">Детали лога</h3>
                              <button
                                onClick={() => setExpandedLog(null)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                ✕
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">ID:</span>
                                <span className="ml-2 text-gray-700 font-mono text-xs">{log.id}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Уровень:</span>
                                <span className="ml-2">{log.level}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Время:</span>
                                <span className="ml-2">{formatDate(log.createdAt)}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Источник:</span>
                                <span className="ml-2 font-mono text-xs">{log.source || '—'}</span>
                              </div>
                              {log.userId && (
                                <div>
                                  <span className="text-gray-500">User ID:</span>
                                  <span className="ml-2 font-mono text-xs">{log.userId}</span>
                                </div>
                              )}
                              {log.requestId && (
                                <div>
                                  <span className="text-gray-500">Request ID:</span>
                                  <span className="ml-2 font-mono text-xs">{log.requestId}</span>
                                </div>
                              )}
                              {log.url && (
                                <div>
                                  <span className="text-gray-500">URL:</span>
                                  <span className="ml-2 font-mono text-xs">{log.url}</span>
                                </div>
                              )}
                            </div>
                            
                            <div>
                              <span className="text-gray-500 text-sm">Сообщение:</span>
                              <pre className="mt-1 p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 overflow-x-auto whitespace-pre-wrap">
                                {log.message}
                              </pre>
                            </div>
                            
                            {log.stack && (
                              <div>
                                <span className="text-gray-500 text-sm">Stack trace:</span>
                                <pre className="mt-1 p-3 bg-white border border-gray-200 rounded-lg text-xs text-red-600 font-mono overflow-x-auto whitespace-pre-wrap">
                                  {log.stack}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Пагинация */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex justify-between items-center">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Назад
            </button>
            <span className="text-sm text-gray-500">
              Страница {pagination.page} из {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Вперёд →
            </button>
          </div>
        )}
      </div>

      {/* Модал очистки */}
      {showCleanupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Очистить старые логи</h2>
            <p className="text-sm text-gray-600 mb-4">
              Удалить все логи старше указанного количества дней.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Удалить логи старше (дней):
              </label>
              <input
                type="number"
                value={cleanupDays}
                onChange={(e) => setCleanupDays(e.target.value)}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5858E2]"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCleanup}
                disabled={cleaning}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {cleaning ? 'Удаление...' : 'Удалить'}
              </button>
              <button
                onClick={() => setShowCleanupModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}