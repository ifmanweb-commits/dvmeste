'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, ImageOff } from 'lucide-react'
import { getPhotosForModeration, type UserWithPhotos } from '@/lib/actions/moderation-photos'
import { UserPhotoGroup } from './components/UserPhotoGroup'

export default function PhotosModerationPage() {
  const [userGroups, setUserGroups] = useState<UserWithPhotos[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadPhotos = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getPhotosForModeration()
      setUserGroups(data)
    } catch (error) {
      console.error('Error loading photos:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPhotos()
  }, [loadPhotos])

  // Обработка действия с фото (принятие/отклонение)
  const handlePhotoAction = useCallback(() => {
    loadPhotos()
  }, [loadPhotos])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#5858E2]" />
      </div>
    )
  }

  if (userGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
        <ImageOff className="w-16 h-16 mb-4 text-gray-300" />
        <p className="text-lg font-medium text-gray-700">Нет фото на модерации</p>
        <p className="text-sm text-gray-500 mt-1">
          Все фотографии проверены или отсутствуют
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Модерация фотографий</h1>
        <p className="text-gray-500 mt-1">
          Непроверенные фотографии психологов ({userGroups.length} пользователей)
        </p>
      </div>

      {/* Список групп фото */}
      <div className="space-y-6">
        {userGroups.map((userGroup) => (
          <UserPhotoGroup
            key={userGroup.user.id}
            userGroup={userGroup}
            onPhotoAction={handlePhotoAction}
          />
        ))}
      </div>
    </div>
  )
}
