"use client"

import { useState } from 'react'
import Link from 'next/link'
import { FileText, CheckCircle, Lock, ExternalLink } from 'lucide-react'
import { Certification } from '@prisma/client'

interface Lesson {
  id: string
  slug: string
  title: string
  description: string | null
  isCompleted: boolean
  firstViewedAt: Date | null
  price: number | null
  certifications: Certification[]
}

interface LessonsListClientProps {
  lessons: Lesson[]
  certifications: Certification[]
  userBalance: number
}

export default function LessonsListClient({
  lessons,
  certifications,
  userBalance,
}: LessonsListClientProps) {
  const [selectedCert, setSelectedCert] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Фильтруем уроки по сертификации и поиску
  const filteredLessons = lessons.filter((lesson) => {
    const matchesCert =
      selectedCert === 'all' ||
      lesson.certifications.some((c) => c.id === selectedCert)

    const matchesSearch =
      searchQuery === '' ||
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lesson.description &&
        lesson.description.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesCert && matchesSearch
  })

  return (
    <div>
      {/* Фильтры */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={selectedCert}
            onChange={(e) => setSelectedCert(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
          >
            <option value="all">Все сертификации</option>
            {certifications.map((cert) => (
              <option key={cert.id} value={cert.id}>
                {cert.title}
              </option>
            ))}
          </select>
        </div>

        <input
          type="text"
          placeholder="Поиск уроков..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
        />
      </div>

      {/* Список уроков */}
      {filteredLessons.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-500">Уроки не найдены</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              userBalance={userBalance}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function LessonCard({
  lesson,
  userBalance,
}: {
  lesson: Lesson
  userBalance: number
}) {
  const isFree = !lesson.price || lesson.price === 0
  const isPaid = !isFree
  const canAfford = userBalance >= (lesson.price || 0)
  const isCompleted = lesson.isCompleted

  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-white p-5 transition-shadow hover:shadow-md ${
        isCompleted
          ? 'border-green-200 bg-green-50/30'
          : 'border-gray-200'
      }`}
    >
      {/* Статус выполнения */}
      {isCompleted && (
        <div className="absolute right-3 top-3 text-green-600">
          <CheckCircle className="h-5 w-5" />
        </div>
      )}

      {/* Иконка урока */}
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            isCompleted
              ? 'bg-green-100 text-green-600'
              : 'bg-[#5858E2]/10 text-[#5858E2]'
          }`}
        >
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{lesson.title}</h3>
          {isPaid && (
            <p className="text-sm text-gray-500">
              {lesson.price ? Math.floor(lesson.price / 100) : 0} ₽
            </p>
          )}
        </div>
      </div>

      {/* Описание */}
      {lesson.description && (
        <p className="mb-4 line-clamp-2 text-sm text-gray-600">
          {lesson.description}
        </p>
      )}

      {/* Сертификации */}
      {lesson.certifications.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1">
          {lesson.certifications.slice(0, 2).map((cert) => (
            <span
              key={cert.id}
              className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
            >
              {cert.title}
            </span>
          ))}
          {lesson.certifications.length > 2 && (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
              +{lesson.certifications.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Кнопка */}
      <Link
        href={`/account/certification/lessons/${lesson.slug}`}
        className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${
          isCompleted
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : isPaid
              ? canAfford
                ? 'bg-[#5858E2] text-white hover:bg-[#4a4ac4]'
                : 'bg-gray-200 text-gray-500'
              : 'bg-[#5858E2] text-white hover:bg-[#4a4ac4]'
        }`}
      >
        {isCompleted ? (
          <>
            <CheckCircle className="h-4 w-4" />
            Пройдено
          </>
        ) : isPaid ? (
          canAfford ? (
            <>
              <Lock className="h-4 w-4" />
              Разблокировать
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              Недостаточно средств
            </>
          )
        ) : (
          <>
            <FileText className="h-4 w-4" />
            Начать урок
          </>
        )}
      </Link>
    </div>
  )
}