'use client'

import { useState } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import { approvePhoto, rejectPhoto } from '@/lib/actions/moderation-photos'

interface PhotoCardProps {
  photo: {
    id: string
    url: string
    filename: string
    uploadedAt: Date
  }
  onAction: () => void
}

export function PhotoCard({ photo, onAction }: PhotoCardProps) {
  const [isLoading, setIsLoading] = useState<'approve' | 'reject' | null>(null)

  const handleApprove = async () => {
    setIsLoading('approve')
    try {
      await approvePhoto(photo.id)
      onAction()
    } catch (error) {
      console.error('Error approving photo:', error)
    } finally {
      setIsLoading(null)
    }
  }

  const handleReject = async () => {
    setIsLoading('reject')
    try {
      await rejectPhoto(photo.id)
      onAction()
    } catch (error) {
      console.error('Error rejecting photo:', error)
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Превью фото */}
      <div className="aspect-square bg-gray-100 relative">
        <img
          src={photo.url}
          alt={photo.filename}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Кнопки действий */}
      <div className="p-3 flex gap-2 justify-center">
        <button
          onClick={handleApprove}
          disabled={isLoading !== null}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white transition-colors"
          title="Принять"
        >
          {isLoading === 'approve' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Check className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={handleReject}
          disabled={isLoading !== null}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white transition-colors"
          title="Отклонить"
        >
          {isLoading === 'reject' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <X className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  )
}
