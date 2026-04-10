'use client'

import { useState } from 'react'
import Image from 'next/image'
import { DocumentType } from '@prisma/client'

interface EducationItem {
  type: DocumentType
  organization: string | null
  programName: string | null
  year: number | null
}

interface EducationBlockProps {
  education: EducationItem[]
}

// Порядок сортировки типов документов
const TYPE_ORDER: Record<DocumentType, number> = {
  ACADEMIC_EDUCATION: 1,
  PROFESSIONAL_TRAINING: 2,
  COURSE: 3,
  SUPPORTING_DOC: 4,
  OTHER: 5,
  LINK: 6,
  PHOTO: 7,
}

// Иконки для каждого типа
const TYPE_ICONS: Record<DocumentType, string> = {
  ACADEMIC_EDUCATION: '/images/edu-icons/academic.png',
  PROFESSIONAL_TRAINING: '/images/edu-icons/qualification.png',
  COURSE: '/images/edu-icons/course.png',
  SUPPORTING_DOC: '/images/edu-icons/other.png',
  OTHER: '/images/edu-icons/other.png',
  LINK: '/images/edu-icons/other.png',
  PHOTO: '/images/edu-icons/other.png',
}

// Названия типов (короткие)
const TYPE_LABELS_SHORT: Record<DocumentType, string> = {
  ACADEMIC_EDUCATION: 'Диплом',
  PROFESSIONAL_TRAINING: 'Повышение квалификации',
  COURSE: 'Курсы',
  SUPPORTING_DOC: 'Другое',
  OTHER: 'Другое',
  LINK: 'Другое',
  PHOTO: 'Другое',
}

// Цвета фона для разных типов (от тёмно-зелёного к белому)
const TYPE_COLORS: Record<DocumentType, string> = {
  ACADEMIC_EDUCATION: 'bg-[#C8E6C9]',
  PROFESSIONAL_TRAINING: 'bg-[#DCEDC8]',
  COURSE: 'bg-[#F0F4C3]',
  SUPPORTING_DOC: 'bg-[#FFF9C4]',
  OTHER: 'bg-white',
  LINK: 'bg-white',
  PHOTO: 'bg-white',
}

export function EducationBlock({ education }: EducationBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!education || education.length === 0) {
    return null
  }

  // Сортируем: сначала по типу (академическое > квалификация > курсы > иное), затем по году (новые к старым)
  const sortedEducation = [...education].sort((a, b) => {
    const typeDiff = (TYPE_ORDER[a.type] || 99) - (TYPE_ORDER[b.type] || 99)
    if (typeDiff !== 0) return typeDiff
    
    // Если типы одинаковые, сортируем по году (от новых к старым)
    if (a.year && b.year) return b.year - a.year
    if (a.year) return -1
    if (b.year) return 1
    return 0
  })

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Образование</h2>
      <p className="text-sm text-green-700 mb-3">Все документы проверены</p>
      
      {/* Кнопка "Показать все документы" / "Скрыть" */}
      <div className="mb-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-[#5858E2] hover:text-[#4a4ac7] font-medium transition-colors cursor-pointer"
        >
          {isExpanded ? 'Скрыть' : 'Показать все документы'}
        </button>
      </div>

      {/* Контейнер с анимацией раскрытия */}
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {/* Десктопная версия - компактная таблица */}
        <div className="hidden sm:block overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="w-12 px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Иконка
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Тип
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Заведение
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Содержание
                </th>
                <th scope="col" className="w-16 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Год
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {sortedEducation.map((item, index) => (
                <tr key={index} className={TYPE_COLORS[item.type]}>
                  <td className="px-3 py-2">
                    <Image
                      src={TYPE_ICONS[item.type]}
                      alt={TYPE_LABELS_SHORT[item.type]}
                      width={48}
                      height={48}
                      className="w-12 h-12 object-contain mx-auto"
                      unoptimized
                    />
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900">
                    {TYPE_LABELS_SHORT[item.type]}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900">
                    {item.organization || '—'}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900">
                    {item.programName || '—'}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">
                    {item.year || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Мобильная версия - вертикальные карточки */}
        <div className="sm:hidden space-y-3">
          {sortedEducation.map((item, index) => (
            <div key={index} className={`rounded-lg border border-gray-200 p-3 ${TYPE_COLORS[item.type]}`}>
              <div className="flex items-start gap-2 mb-2">
                <Image
                  src={TYPE_ICONS[item.type]}
                  alt={TYPE_LABELS_SHORT[item.type]}
                  width={50}
                  height={50}
                  className="w-[50px] h-[50px] object-contain shrink-0"
                  unoptimized
                />
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-900">
                    {TYPE_LABELS_SHORT[item.type]}
                  </p>
                </div>
              </div>
              
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Заведение:</span>
                  <span className="text-gray-900 font-medium">{item.organization || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Содержание:</span>
                  <span className="text-gray-900 font-medium">{item.programName || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Год:</span>
                  <span className="text-gray-900 font-medium">{item.year || '—'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}