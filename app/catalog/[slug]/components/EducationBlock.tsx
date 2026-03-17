'use client'

import Image from 'next/image'
import { CheckCircle } from 'lucide-react'
import { Tooltip } from '@/components/ui/Tooltip'
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

// Названия типов
const TYPE_LABELS: Record<DocumentType, string> = {
  ACADEMIC_EDUCATION: 'Академическое образование',
  PROFESSIONAL_TRAINING: 'Профессиональная переподготовка',
  COURSE: 'Курсы и интенсивы',
  SUPPORTING_DOC: 'Подтверждающий документ',
  OTHER: 'Другое',
  LINK: 'Ссылка',
  PHOTO: 'Фото',
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
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Образование</h2>
      
      {/* Десктопная версия - таблица */}
      <div className="hidden sm:block overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Тип
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Учебное заведение
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Специальность
              </th>
              <th scope="col" className="w-20 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Год
              </th>
              <th scope="col" className="w-12 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                ✓
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {sortedEducation.map((item, index) => (
              <tr key={index} className={TYPE_COLORS[item.type]}>
                <td className="px-4 py-3">
                  <Image
                    src={TYPE_ICONS[item.type]}
                    alt={TYPE_LABELS[item.type]}
                    width={120}
                    height={120}
                    className="w-28 h-28 object-contain"
                  />
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {item.organization || '—'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {item.programName || '—'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                  {item.year || '—'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <Tooltip content="Документ проверен">
                    <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                  </Tooltip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Мобильная версия - вертикальные карточки */}
      <div className="sm:hidden space-y-3">
        {sortedEducation.map((item, index) => (
          <div key={index} className={`rounded-lg border border-gray-200 p-4 ${TYPE_COLORS[item.type]}`}>
            <div className="flex items-start gap-3 mb-3">
              <Image
                src={TYPE_ICONS[item.type]}
                alt={TYPE_LABELS[item.type]}
                width={95}
                height={95}
                className="w-[95px] h-[95px] object-contain shrink-0"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {TYPE_LABELS[item.type]}
                </p>
              </div>
              <Tooltip content="Документ проверен">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              </Tooltip>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Заведение:</span>
                <span className="text-gray-900 font-medium">{item.organization || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Специальность:</span>
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
  )
}
