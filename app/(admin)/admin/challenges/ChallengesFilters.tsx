'use client';

import Link from 'next/link';
import { Certification } from '@prisma/client';

interface ChallengesFiltersProps {
  typeFilter?: string;
  certificationFilter?: string;
  certifications: Certification[];
}

export default function ChallengesFilters({
  typeFilter,
  certificationFilter,
  certifications,
}: ChallengesFiltersProps) {
  return (
    <div className="mb-6 flex gap-4 items-end">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Тип испытания
        </label>
        <select
          key={`type-${typeFilter || 'all'}`}
          defaultValue={typeFilter || 'all'}
          onChange={(e) => {
            const url = new URL(window.location.href);
            if (e.target.value === 'all') {
              url.searchParams.delete('type');
            } else {
              url.searchParams.set('type', e.target.value);
            }
            window.location.href = url.toString();
          }}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
        >
          <option value="all">Все типы</option>
          <option value="TEST">Тест</option>
          <option value="WORK">Работа</option>
          <option value="LESSON">Урок</option>
        </select>
      </div>

      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Сертификация
        </label>
        <select
          key={`cert-${certificationFilter || 'all'}`}
          defaultValue={certificationFilter || 'all'}
          onChange={(e) => {
            const url = new URL(window.location.href);
            if (e.target.value === 'all') {
              url.searchParams.delete('certification');
            } else {
              url.searchParams.set('certification', e.target.value);
            }
            window.location.href = url.toString();
          }}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
        >
          <option value="all">Все сертификации</option>
          {certifications.map((cert) => (
            <option key={cert.id} value={cert.id}>
              {cert.title}
            </option>
          ))}
        </select>
      </div>

      {(typeFilter || certificationFilter) && (
        <Link
          href="/admin/challenges"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Сбросить
        </Link>
      )}
    </div>
  );
}