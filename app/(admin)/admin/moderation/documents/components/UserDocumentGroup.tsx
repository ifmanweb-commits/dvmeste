'use client'

import Link from 'next/link'
import { DocumentCard } from './DocumentCard'
import { UserWithDocuments } from '@/lib/actions/moderation-documents'

interface UserDocumentGroupProps {
  userGroup: UserWithDocuments
  onDocumentAction: () => void
}

export function UserDocumentGroup({ userGroup, onDocumentAction }: UserDocumentGroupProps) {
  const { user, documents } = userGroup

  const displayName = user.fullName || 'Без имени'

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      {/* Шапка с информацией о пользователе */}
      <div className="mb-6 pb-4 border-b border-gray-200">
        <Link
          href={`/admin/psychologists/${user.id}/edit`}
          className="text-lg font-semibold text-gray-900 hover:text-[#5858E2] hover:underline"
        >
          {displayName}
        </Link>
        <p className="text-sm text-gray-500 mt-1">
          {user.email} · {documents.length} {getDocCountLabel(documents.length)} на проверку
        </p>
      </div>

      {/* Список документов */}
      <div className="space-y-6">
        {documents.map((doc) => (
          <DocumentCard
            key={doc.id}
            document={doc}
            onAction={onDocumentAction}
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
