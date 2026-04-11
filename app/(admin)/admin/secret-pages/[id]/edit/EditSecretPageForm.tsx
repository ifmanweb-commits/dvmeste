'use client'

import { useState } from 'react'
import { updateSecretPage } from '../../actions'
import Link from 'next/link'

interface SecretPage {
  id: string
  slug: string
  title: string
  description: string | null
  filePath: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

interface EditSecretPageFormProps {
  page: SecretPage
  images: string[]
}

export default function EditSecretPageForm({ page, images: initialImages }: EditSecretPageFormProps) {
  const [images, setImages] = useState<string[]>(initialImages)
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([])
  const [newImages, setNewImages] = useState<File[]>([])

  const handleImageDelete = (imagePath: string) => {
    setImages(images.filter(img => img !== imagePath))
    setImagesToDelete([...imagesToDelete, imagePath])
  }

  const handleNewImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewImages([...newImages, ...Array.from(e.target.files)])
    }
  }

  const handleSubmit = async (formData: FormData) => {
    // Добавляем изображения для удаления через hidden field
    formData.append('deleteImages', imagesToDelete.join(','))
    await updateSecretPage(page.id, formData)
  }

  return (
    <form
      action={handleSubmit}
      className="mx-auto max-w-2xl space-y-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Slug
        </label>
        <input
          type="text"
          value={page.slug}
          disabled
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-100 text-gray-500"
        />
        <p className="mt-1 text-xs text-gray-500">Slug нельзя изменить</p>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Заголовок
        </label>
        <input
          type="text"
          name="title"
          id="title"
          defaultValue={page.title}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Описание
        </label>
        <textarea
          name="description"
          id="description"
          rows={3}
          defaultValue={page.description || ''}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
        />
      </div>

      <div>
        <label htmlFor="htmlFile" className="block text-sm font-medium text-gray-700 mb-1">
          Новый HTML файл
        </label>
        <input
          type="file"
          name="htmlFile"
          id="htmlFile"
          accept=".html,.htm"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
        />
        <p className="mt-1 text-xs text-gray-500">
          Оставьте пустым, чтобы сохранить текущий файл
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Текущие изображения
        </label>
        {images.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {images.map((img) => (
              <div key={img} className="relative group">
                <img
                  src={img}
                  alt=""
                  className="h-24 w-full object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => handleImageDelete(img)}
                  className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Нет изображений</p>
        )}
      </div>

      <input type="hidden" name="deleteImages" value={imagesToDelete.join(',')} />

      <div>
        <label htmlFor="newImages" className="block text-sm font-medium text-gray-700 mb-1">
          Добавить изображения
        </label>
        <input
          type="file"
          name="images"
          id="newImages"
          multiple
          accept="image/*"
          onChange={handleNewImagesChange}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
        />
      </div>

      {newImages.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Новые изображения:</p>
          <div className="grid grid-cols-3 gap-3">
            {newImages.map((file, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="h-24 w-full object-cover rounded-lg border border-gray-200"
                />
                <p className="text-xs text-gray-500 mt-1 truncate">{file.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]"
        >
          Сохранить изменения
        </button>
        <Link
          href="/admin/secret-pages"
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
        >
          Отмена
        </Link>
      </div>
    </form>
  )
}
