'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/require'
import { Prisma, PsychologistStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache';

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
        // Опционально: можно сразу проставить дату публикации или другие поля
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
      where.OR = [
        { 
          fullName: { 
            contains: search, 
            mode: Prisma.QueryMode.insensitive 
          } 
        },
        { 
          email: { 
            contains: search, 
            mode: Prisma.QueryMode.insensitive 
          } 
        }
      ]
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
        price: true,
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