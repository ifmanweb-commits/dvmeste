'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, FileText } from 'lucide-react'
import { getDocumentsForModeration, type UserWithDocuments } from '@/lib/actions/moderation-documents'
import { UserDocumentGroup } from './components/UserDocumentGroup'
import { DocumentType } from '@prisma/client'
import { getDocumentTypeLabel } from '@/lib/utils/moderation-helpers'

const DOCUMENT_TYPES: Array<{ value: DocumentType | 'all'; label: string }> = [
  { value: 'all', label: 'Все типы' },
  { value: 'ACADEMIC_EDUCATION', label: 'Академическое образование' },
  { value: 'PROFESSIONAL_TRAINING', label: 'Профессиональная переподготовка' },
  { value: 'COURSE', label: 'Курсы и интенсивы' },
  { value: 'SUPPORTING_DOC', label: 'Подтверждающие документы' },
  { value: 'OTHER', label: 'Другое' }
]

export default function DocumentsModerationPage() {
  const [userGroups, setUserGroups] = useState<UserWithDocuments[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<DocumentType | 'all'>('all')

  const loadDocuments = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getDocumentsForModeration({
        type: selectedType
      })
      setUserGroups(data)
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedType])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  // Обработка действия с документом (принятие/отклонение)
  const handleDocumentAction = useCallback(() => {
    loadDocuments()
  }, [loadDocuments])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#5858E2]" />
      </div>
    )
  }

  if (userGroups.length === 0) {
    return (
      <div className="space-y-6">
        {/* Заголовок и фильтры */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Модерация документов</h1>
            <p className="text-gray-500 mt-1">
              Непроверенные документы психологов
            </p>
          </div>

          {/* Фильтр по типу */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as DocumentType | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#5858E2]"
          >
            {DOCUMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Пустое состояние */}
        <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
          <FileText className="w-16 h-16 mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-700">Нет документов на модерации</p>
          <p className="text-sm text-gray-500 mt-1">
            Все документы проверены или отсутствуют
          </p>
        </div>
      </div>
    )
  }

  const totalDocs = userGroups.reduce((sum, group) => sum + group.documents.length, 0)

  return (
    <div className="space-y-6">
      {/* Заголовок и фильтры */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Модерация документов</h1>
          <p className="text-gray-500 mt-1">
            Непроверенные документы ({userGroups.length} пользователей, {totalDocs} {getDocCountLabel(totalDocs)})
          </p>
        </div>

        {/* Фильтр по типу */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as DocumentType | 'all')}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#5858E2]"
        >
          {DOCUMENT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Список групп документов */}
      <div className="space-y-6">
        {userGroups.map((userGroup) => (
          <UserDocumentGroup
            key={userGroup.user.id}
            userGroup={userGroup}
            onDocumentAction={handleDocumentAction}
          />
        ))}
      </div>
    </div>
  )
}

function getDocCountLabel(count: number): string {
  if (count === 1) return 'документ'
  if (count >= 2 && count <= 4) return 'документа'
  return 'документов'
}
