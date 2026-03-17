'use client'

import { useState } from 'react'
import { FileText, ExternalLink, Check, X, Loader2 } from 'lucide-react'
import { approveDocument, rejectDocument } from '@/lib/actions/moderation-documents'
import { getDocumentTypeLabel, formatFileSize } from '@/lib/utils/moderation-helpers'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { DocumentType } from '@prisma/client'

interface DocumentCardProps {
  document: {
    id: string
    type: DocumentType
    url: string
    filename: string
    mimeType: string
    size: number
    description: string | null
    uploadedAt: Date
    organization: string | null
    programName: string | null
    year: number | null
  }
  onAction: () => void
}

export function DocumentCard({ document, onAction }: DocumentCardProps) {
  const [isLoading, setIsLoading] = useState<'approve' | 'reject' | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const isImage = document.mimeType.startsWith('image/')
  const isPdf = document.mimeType === 'application/pdf'

  const handleApprove = async () => {
    setIsLoading('approve')
    try {
      await approveDocument(document.id)
      onAction()
    } catch (error) {
      console.error('Error approving document:', error)
    } finally {
      setIsLoading(null)
    }
  }

  const handleReject = async () => {
    setIsLoading('reject')
    try {
      await rejectDocument(document.id)
      onAction()
    } catch (error) {
      console.error('Error rejecting document:', error)
    } finally {
      setIsLoading(null)
    }
  }

  const handleRejectClick = () => {
    setIsModalOpen(true)
  }

  const handleModalConfirm = async () => {
    setIsModalOpen(false)
    await handleReject()
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  // Получаем иконку для типа документа
  const getTypeIcon = () => {
    const iconMap: Record<DocumentType, string> = {
      ACADEMIC_EDUCATION: '/images/edu-icons/academic.png',
      PROFESSIONAL_TRAINING: '/images/edu-icons/qualification.png',
      COURSE: '/images/edu-icons/course.png',
      SUPPORTING_DOC: '/images/edu-icons/other.png',
      LINK: '/images/edu-icons/other.png',
      PHOTO: '/images/edu-icons/other.png',
      OTHER: '/images/edu-icons/other.png'
    }
    return iconMap[document.type] || '/images/edu-icons/other.png'
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        {/* Превью документа */}
        <div className="mb-4">
          {isImage ? (
            <a
              href={document.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={document.url}
                  alt={document.filename}
                  className="w-full h-auto max-h-96 object-contain"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <ExternalLink className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </a>
          ) : (
            <a
              href={document.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <div className="bg-gray-100 rounded-lg p-8 flex flex-col items-center justify-center min-h-[200px] group-hover:bg-gray-200 transition-colors">
                {isPdf ? (
                  <FileText className="w-16 h-16 text-red-500 mb-4" />
                ) : (
                  <img
                    src={getTypeIcon()}
                    alt={document.type}
                    className="w-16 h-16 mb-4 opacity-70"
                  />
                )}
                <p className="text-sm text-gray-600 text-center font-medium">
                  {document.filename}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatFileSize(document.size)}
                </p>
              </div>
            </a>
          )}
        </div>

        {/* Мета-информация */}
        <div className="space-y-2 mb-4">
          {/* Тип документа с иконкой */}
          <div className="flex items-center gap-2">
            <img
              src={getTypeIcon()}
              alt={document.type}
              className="w-5 h-5"
            />
            <span className="text-sm font-medium text-gray-700">
              {getDocumentTypeLabel(document.type)}
            </span>
          </div>

          {/* Организация и год */}
          {(document.organization || document.year) && (
            <p className="text-sm text-gray-600">
              {document.organization}
              {document.organization && document.year && ', '}
              {document.year && `${document.year} г.`}
            </p>
          )}

          {/* Название программы */}
          {document.programName && (
            <p className="text-sm text-gray-600">{document.programName}</p>
          )}

          {/* Описание */}
          {document.description && (
            <p className="text-sm text-gray-500 italic">{document.description}</p>
          )}

          {/* Имя файла и размер */}
          <p className="text-xs text-gray-500">
            {document.filename} · {formatFileSize(document.size)}
          </p>
        </div>

        {/* Кнопки действий */}
        <div className="flex gap-2">
          <a
            href={document.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Открыть
          </a>

          <button
            onClick={handleApprove}
            disabled={isLoading !== null}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-lg text-sm font-medium transition-colors flex-1"
          >
            {isLoading === 'approve' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Принять
          </button>

          <button
            onClick={handleRejectClick}
            disabled={isLoading !== null}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {isLoading === 'reject' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <X className="w-4 h-4" />
            )}
            Отклонить
          </button>
        </div>
      </div>

      {/* Модальное окно подтверждения */}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onConfirm={handleModalConfirm}
        title="Удаление документа"
        message="Удалить документ безвозвратно? Это действие нельзя отменить."
        confirmText="Удалить"
        cancelText="Отмена"
        isDestructive
        isLoading={isLoading === 'reject'}
      />
    </>
  )
}
