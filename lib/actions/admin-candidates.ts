'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/require'
import { Prisma, PsychologistStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache';
import { hashEmail } from '@/lib/utils/hash-email';
import { getAllCourses } from './courses';

interface GetCandidatesListParams {
  page: number
  limit: number
  search?: string
}

export async function activateCandidate(id: string) {
  await requireAdmin()
  
  try {
    await prisma.user.update({
      where: { id },
      data: { 
        status: PsychologistStatus.ACTIVE,
      }
    })
    
    revalidatePath('/admin/candidates')
    return { success: true }
  } catch (error) {
    console.error('ActivateCandidateError:', error)
    return { success: false, error: "Не удалось активировать кандидата" }
  }
}

export async function getCandidatesList({ 
  page, 
  limit, 
  search = '' 
}: { 
  page: number
  limit: number
  search?: string
}) {
  await requireAdmin()
  
  if (!prisma) {
    return {
      items: [],
      total: 0,
      pages: 0,
      currentPage: page
    }
  }

  try {
    const where: Prisma.UserWhereInput = {
      status: {
        in: [PsychologistStatus.PENDING, PsychologistStatus.CANDIDATE]
      }
    }

    if (search) {
      const isEmail = search.includes('@');
      
      if (isEmail) {
        const emailHash = hashEmail(search);
        where.emailHash = emailHash;
      } else {
        where.fullName = {
          contains: search,
          mode: Prisma.QueryMode.insensitive
        };
      }
    }

    const total = await prisma.user.count({ where })

    const items = await prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        city: true,
        gender: true,
        birthDate: true,
        price: true,
        freeSession: true,
        certificationLevel: true,
        status: true,
        createdAt: true,
        workFormat: true,
        mainParadigm: true,
        contactInfo: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    })

    return {
      items,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    }
  } catch (error) {
    console.error('Error fetching candidates:', error)
    return {
      items: [],
      total: 0,
      pages: 0,
      currentPage: page
    }
  }
}

/**
 * Получить кандидата по ID
 */
export async function getCandidateById(id: string) {
  await requireAdmin()
  
  try {
    const candidate = await prisma.user.findUnique({
      where: { id },
      include: {
        courses: {
          include: {
            course: true,
          },
        },
      },
    })
    
    return candidate
  } catch (error) {
    console.error('Error fetching candidate:', error)
    return null
  }
}

/**
 * Обновить данные кандидата
 */
export async function updateCandidate(id: string, data: {
  fullName?: string
  email?: string
  city?: string
  gender?: string
  birthDate?: Date | null
  price?: number | undefined
  workFormat?: string
  contactInfo?: string
}) {
  await requireAdmin()
  
  try {
    await prisma.user.update({
      where: { id },
      data,
    })
    
    revalidatePath('/admin/candidates')
    return { success: true }
  } catch (error) {
    console.error('Error updating candidate:', error)
    return { success: false, error: "Ошибка при обновлении кандидата" }
  }
}

/**
 * Проверить психолога (активировать + назначить уровень сертификации)
 */
export async function verifyPsychologist(id: string, certificationLevel: number) {
  await requireAdmin()
  
  try {
    await prisma.user.update({
      where: { id },
      data: {
        status: PsychologistStatus.ACTIVE,
        certificationLevel,
      },
    })
    
    revalidatePath('/admin/candidates')
    revalidatePath('/admin/psychologists')
    
    return { success: true }
  } catch (error) {
    console.error('Error verifying psychologist:', error)
    return { success: false, error: "Ошибка при проверке психолога" }
  }
}