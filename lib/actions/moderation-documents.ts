'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/require'
import { DocumentType } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { promises as fs } from 'fs'
import path from 'path'
import { getDocumentTypeLabel, formatFileSize } from '@/lib/utils/moderation-helpers'

// ======================================
// ТИПЫ
// ======================================

export type DocumentWithUser = {
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
  user: {
    id: string
    fullName: string | null
    email: string
  }
}

export type UserWithDocuments = {
  user: {
    id: string
    fullName: string | null
    email: string
  }
  documents: DocumentWithUser[]
}

// ======================================
// SERVER ACTIONS
// ======================================

/**
 * Получить все документы на модерации, сгруппированные по пользователям
 */
export async function getDocumentsForModeration(filters?: {
  type?: DocumentType | 'all'
}): Promise<UserWithDocuments[]> {
  await requireAdmin()

  if (!prisma) return []

  try {
    const whereClause: any = {
      verifiedAt: null,
      type: filters?.type && filters.type !== 'all'
        ? filters.type
        : {
            in: [
              DocumentType.ACADEMIC_EDUCATION,
              DocumentType.PROFESSIONAL_TRAINING,
              DocumentType.COURSE,
              DocumentType.SUPPORTING_DOC,
              DocumentType.OTHER
            ]
          }
    }

    // Получаем все непроверенные документы (кроме PHOTO и LINK)
    const documents = await prisma.document.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    })

    // Группируем по пользователям
    const userMap = new Map<string, UserWithDocuments>()

    for (const doc of documents) {
      const userId = doc.userId

      if (!userMap.has(userId)) {
        userMap.set(userId, {
          user: {
            id: doc.user.id,
            fullName: doc.user.fullName,
            email: doc.user.email
          },
          documents: []
        })
      }

      userMap.get(userId)!.documents.push({
        id: doc.id,
        type: doc.type,
        url: doc.url,
        filename: doc.filename,
        mimeType: doc.mimeType,
        size: doc.size,
        description: doc.description,
        uploadedAt: doc.uploadedAt,
        organization: doc.organization,
        programName: doc.programName,
        year: doc.year,
        user: {
          id: doc.user.id,
          fullName: doc.user.fullName,
          email: doc.user.email
        }
      })
    }

    // Конвертируем Map в массив
    const result = Array.from(userMap.values())

    return result
  } catch (error) {
    console.error('Error fetching documents for moderation:', error)
    return []
  }
}

/**
 * Одобрить один документ
 */
export async function approveDocument(docId: string) {
  await requireAdmin()

  if (!prisma) {
    throw new Error('Database connection not available')
  }

  try {
    await prisma.document.update({
      where: { id: docId },
      data: {
        verifiedAt: new Date()
      }
    })

    revalidatePath('/admin/moderation/documents')
    revalidatePath('/catalog') // Обновить кэш каталога
    revalidatePath('/catalog/[slug]') // Обновить кэш профиля
  } catch (error) {
    console.error('Error approving document:', error)
    throw error
  }
}

/**
 * Отклонить один документ (удалить с диска и из БД)
 */
export async function rejectDocument(docId: string) {
  await requireAdmin()

  if (!prisma) {
    throw new Error('Database connection not available')
  }

  try {
    // Получаем информацию о документе
    const document = await prisma.document.findUnique({
      where: { id: docId },
      select: {
        url: true
      }
    })

    if (!document) {
      throw new Error('Document not found')
    }

    // Удаляем файл с диска
    const filePath = path.join(process.cwd(), 'public', document.url)
    await fs.unlink(filePath).catch(() => {
      // Игнорируем ошибку, если файл уже удалён или не существует
      console.log(`Файл уже удален или не существует: ${filePath}`)
    })

    // Удаляем запись из БД
    await prisma.document.delete({
      where: { id: docId }
    })

    revalidatePath('/admin/moderation/documents')
    revalidatePath('/catalog') // Обновить кэш каталога
    revalidatePath('/catalog/[slug]') // Обновить кэш профиля
  } catch (error) {
    console.error('Error rejecting document:', error)
    throw error
  }
}
