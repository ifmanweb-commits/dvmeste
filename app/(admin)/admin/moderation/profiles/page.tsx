'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MapPin, 
  DollarSign, 
  MessageSquare,
  ChevronLeft,
  Loader2,
  Eye
} from 'lucide-react'

// Импортируем server actions
import { 
  getProfilesForModeration,
  approveProfileDraft,
  rejectProfileDraft 
} from '@/lib/actions/admin-psychologists'

// Типы
type DraftData = {
  status: 'PENDING' | 'REJECTED';
  submittedAt: string;
  comment?: string;
  data: {
    shortBio?: string;
    longBio?: string;
    mainParadigm?: string[];
    firstDiplomaDate?: string;
  };
}

type ProfileWithDraft = {
  id: string;
  fullName: string | null;
  email: string;
  status: string;
  isPublished: boolean;
  city?: string | null;
  price?: number | null;
  certificationLevel?: number;
  draftData: DraftData | null;
}

// Выносим фильтры в отдельный клиентский компонент
function FilterTabs({ activeFilter, onFilterChange }: { 
  activeFilter: 'pending' | 'rejected' | 'all', 
  onFilterChange: (filter: 'pending' | 'rejected' | 'all') => void 
}) {
  return (
    <div className="bg-white ">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onFilterChange('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeFilter === 'pending'
              ? 'bg-[#5858E2] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          На модерации
        </button>
        <button
          onClick={() => onFilterChange('rejected')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeFilter === 'rejected'
              ? 'bg-[#5858E2] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Отклоненные
        </button>
        <button
          onClick={() => onFilterChange('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeFilter === 'all'
              ? 'bg-[#5858E2] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Все
        </button>
      </div>
    </div>
  )
}

export default function ModerationProfilesPage() {
  const [profiles, setProfiles] = useState<ProfileWithDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProfile, setSelectedProfile] = useState<ProfileWithDraft | null>(null)
  const [activeFilter, setActiveFilter] = useState<'pending' | 'rejected' | 'all'>('pending')
  const [commentText, setCommentText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Загрузка данных
  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = async () => {
    setLoading(true)
    try {
      const data = await getProfilesForModeration()
      setProfiles(data)
    } catch (error) {
      console.error('Error loading profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (profile: ProfileWithDraft) => {
    if (!confirm(`Принять заявку от ${profile.fullName || profile.email}?`)) return
    
    setIsSubmitting(true)
    try {
      const result = await approveProfileDraft(profile.id)
      if (result.success) {
        setProfiles(prev => prev.filter(p => p.id !== profile.id))
        setSelectedProfile(null)
      } else {
        alert(result.error || 'Ошибка при принятии')
      }
    } catch (error) {
      console.error('Error approving profile:', error)
      alert('Ошибка при принятии')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async (profile: ProfileWithDraft) => {
    if (!commentText.trim()) {
      alert('Укажите причину отклонения')
      return
    }
    
    setIsSubmitting(true)
    try {
      const result = await rejectProfileDraft(profile.id, commentText.trim())
      if (result.success) {
        // Обновляем профиль в списке
        setProfiles(prev => prev.map(p => 
          p.id === profile.id 
            ? { 
                ...p, 
                draftData: p.draftData ? { 
                  ...p.draftData, 
                  status: 'REJECTED', 
                  comment: commentText.trim() 
                } : null 
              }
            : p
        ))
        setSelectedProfile(null)
        setCommentText('')
      } else {
        alert(result.error || 'Ошибка при отклонении')
      }
    } catch (error) {
      console.error('Error rejecting profile:', error)
      alert('Ошибка при отклонении')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Фильтрация профилей на клиенте
  const filteredProfiles = profiles.filter(profile => {
    // Поиск по имени/email
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const fullNameMatch = profile.fullName?.toLowerCase().includes(query)
      const emailMatch = profile.email.toLowerCase().includes(query)
      if (!fullNameMatch && !emailMatch) return false
    }
    
    // Фильтр по статусу
    if (activeFilter === 'pending') {
      return profile.draftData?.status === 'PENDING'
    }
    if (activeFilter === 'rejected') {
      return profile.draftData?.status === 'REJECTED'
    }
    return true // 'all'
  })

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-[#5858E2]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen ">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Заголовок */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Модерация профилей
            </h1>
            <p className="text-gray-500 mt-1">
              Заявки на изменение профиля от психологов
            </p>
          </div>
        </div>

        {/* Поиск */}
        <div className="bg-white p-0">
          <input
            type="text"
            placeholder="Поиск по имени или email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#5858E2] focus:border-transparent"
          />
        </div>

        {/* Фильтры-переключатели */}
        <FilterTabs activeFilter={activeFilter} onFilterChange={setActiveFilter} />

        {/* Список профилей */}
        {filteredProfiles.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <MessageSquare className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Нет заявок
            </h3>
            <p className="text-gray-500">
              {activeFilter === 'pending' 
                ? 'Нет заявок на модерацию' 
                : activeFilter === 'rejected'
                  ? 'Нет отклоненных заявок'
                  : 'Нет заявок с черновиками'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProfiles.map((profile) => (
              <div
                key={profile.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Шапка */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {profile.fullName || 'Без имени'}
                      </h3>
                      <p className="text-sm text-gray-500">{profile.email}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      profile.draftData?.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : profile.draftData?.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}>
                      {profile.draftData?.status === 'PENDING' && (
                        <Clock className="h-3 w-3 mr-1" />
                      )}
                      {profile.draftData?.status === 'PENDING' ? 'На проверке' : 'Отклонено'}
                    </span>
                  </div>
                </div>

                {/* Информация */}
                <div className="p-4 space-y-2">
                  {profile.city && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {profile.city}
                    </div>
                  )}
                  {profile.price && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="m-1 text-gray-400">₽</span>
                      {profile.price} 
                    </div>
                  )}
                  {profile.certificationLevel && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-gray-400" />
                      Уровень {profile.certificationLevel}
                    </div>
                  )}
                </div>

                {/* Действия */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                  <button
                    onClick={() => setSelectedProfile(profile)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    Просмотр
                  </button>
                  {profile.draftData?.status === 'PENDING' && (
                    <button
                      onClick={() => handleApprove(profile)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Принять
                    </button>
                  )}
                </div>

                {/* Комментарий при отказе */}
                {profile.draftData?.status === 'REJECTED' && profile.draftData.comment && (
                  <div className="p-4 bg-red-50 border-t border-red-100">
                    <p className="text-sm text-red-800">
                      <span className="font-medium">Причина:</span> {profile.draftData.comment}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модалка просмотра черновика */}
      {selectedProfile && selectedProfile.draftData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            
            {/* Заголовок */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Черновик профиля — {selectedProfile.fullName || selectedProfile.email}
              </h2>
              <button
                onClick={() => {
                  setSelectedProfile(null)
                  setCommentText('')
                }}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Контент черновика */}
            <div className="p-6 space-y-6">
              {/* Основные поля */}
              <div className="space-y-4">
                {selectedProfile.draftData.data.shortBio && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Кратко о себе</label>
                    <p className="mt-1 text-gray-900 whitespace-pre-wrap">
                      {selectedProfile.draftData.data.shortBio}
                    </p>
                  </div>
                )}

                {selectedProfile.draftData.data.longBio && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Подробно о себе</label>
                    <div className="mt-1 text-gray-900 whitespace-pre-wrap">
                      {selectedProfile.draftData.data.longBio}
                    </div>
                  </div>
                )}

                {selectedProfile.draftData.data.mainParadigm && selectedProfile.draftData.data.mainParadigm.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Парадигмы</label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {selectedProfile.draftData.data.mainParadigm.map(p => (
                        <span key={p} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProfile.draftData.data.firstDiplomaDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Первый диплом</label>
                    <p className="mt-1 text-gray-900">
                      {new Date(selectedProfile.draftData.data.firstDiplomaDate).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                )}
              </div>

              {/* Дата отправки */}
              <div className="text-sm text-gray-400 border-t border-gray-100 pt-4">
                Отправлено: {new Date(selectedProfile.draftData.submittedAt).toLocaleString('ru-RU')}
              </div>

              {/* Комментарий при отказе (если уже отклоняли) */}
              {selectedProfile.draftData.status === 'REJECTED' && selectedProfile.draftData.comment && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-red-800 mb-1">Комментарий модератора:</p>
                  <p className="text-sm text-red-700">{selectedProfile.draftData.comment}</p>
                </div>
              )}

              {/* Поле для комментария при отклонении */}
              {selectedProfile.draftData.status === 'PENDING' && (
                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Комментарий при отклонении
                  </label>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Укажите причину отклонения..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5858E2] focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {/* Кнопки действий */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex gap-3">
              <button
                onClick={() => {
                  setSelectedProfile(null)
                  setCommentText('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              
              {selectedProfile.draftData.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => handleReject(selectedProfile)}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin mx-auto h-4 w-4" /> : 'Отклонить'}
                  </button>
                  <button
                    onClick={() => handleApprove(selectedProfile)}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin mx-auto h-4 w-4" /> : 'Принять'}
                  </button>
                </>
              )}

              {selectedProfile.draftData.status === 'REJECTED' && (
                <button
                  onClick={() => setSelectedProfile(null)}
                  className="flex-1 px-4 py-2 bg-[#5858E2] text-white rounded-lg text-sm font-medium hover:bg-[#4b4bcf] transition-colors"
                >
                  Закрыть
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}