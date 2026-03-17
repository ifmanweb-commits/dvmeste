'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Loader2 } from 'lucide-react'
import { approveAllUserPhotos } from '@/lib/actions/moderation-photos'
import { PhotoCard } from './PhotoCard'

interface UserPhotoGroupProps {
  userGroup: {
    user: {
      id: string
      fullName: string | null
      email: string
      avatarUrl: string | null
    }
    photos: Array<{
      id: string
      url: string
      filename: string
      uploadedAt: Date
    }>
  }
  onPhotoAction: () => void
}

export function UserPhotoGroup({ userGroup, onPhotoAction }: UserPhotoGroupProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { user, photos } = userGroup

  const handleApproveAll = async () => {
    setIsLoading(true)
    try {
      await approveAllUserPhotos(user.id)
      onPhotoAction()
    } catch (error) {
      console.error('Error approving all photos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const displayName = user.fullName || 'Без имени'

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      {/* Шапка с информацией о пользователе */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <Link
            href={`/admin/psychologists?id=${user.id}`}
            className="text-lg font-semibold text-gray-900 hover:text-[#5858E2] hover:underline"
          >
            {displayName}
          </Link>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>

        {photos.length > 1 && (
          <button
            onClick={handleApproveAll}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-[#5858E2] hover:bg-[#4a4ac4] disabled:bg-[#a0a0f0] text-white rounded-lg text-sm font-medium transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Принять все ({photos.length})
          </button>
        )}
      </div>

      {/* Сетка фотографий */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            onAction={onPhotoAction}
          />
        ))}
      </div>
    </div>
  )
}
