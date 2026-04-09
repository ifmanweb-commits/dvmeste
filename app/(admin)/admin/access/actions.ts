'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { hashEmail } from '@/lib/utils/hash-email'

export interface UserAccessRecord {
  id: string
  userId: string
  user: {
    email: string
    fullName: string | null
  }
  resourceType: string
  resourceId: string
  resourceName: string
  grantedBy: string
  grantedAt: Date
  expiresAt: Date | null
  createdAt: Date
  metaData?: any
}

export async function getUserAccesses(params: {
  page: number
  limit: number
  search?: string
  resourceType?: string
  resourceId?: string
  source?: 'admin' | 'key'
}): Promise<{
  success: boolean
  data?: {
    accesses: UserAccessRecord[]
    pagination: {
      currentPage: number
      totalPages: number
      total: number
    }
  }
  error?: string
}> {
  try {
    const { page, limit, search, resourceType, resourceId, source } = params

    const where: any = {}

    if (resourceType) {
      where.resourceType = resourceType
    }

    if (resourceId) {
      where.resourceId = resourceId
    }

    if (source === 'admin') {
      where.grantedBy = { startsWith: 'admin_' }
    } else if (source === 'key') {
      where.grantedBy = { startsWith: 'key_' }
    }

    if (search) {
      const emailHash = hashEmail(search.trim())
      const user = await prisma.user.findUnique({
        where: { emailHash },
        select: { id: true }
      })
      if (user) {
        where.userId = user.id
      } else {
        where.userId = 'nonexistent'
      }
    }

    const [accesses, total] = await Promise.all([
      prisma.userAccess.findMany({
        where,
        orderBy: { grantedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.userAccess.count({ where })
    ])

    const userIds = [...new Set(accesses.map(a => a.userId))]
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, fullName: true }
    })
    const userMap = new Map(users.map(u => [u.id, { email: u.email, fullName: u.fullName }]))

    const secretPages = await prisma.secretPage.findMany({
      select: { id: true, title: true }
    })
    const pageMap = new Map(secretPages.map(p => [p.id, p.title]))

    const formattedAccesses: UserAccessRecord[] = accesses.map(a => {
      let resourceName = a.resourceId
      const accessAny = a as any
      if (a.resourceType === 'page') {
        resourceName = pageMap.get(a.resourceId) || 'Неизвестно'
      } else if (a.resourceType === 'catalog') {
        const metaData = accessAny.metaData
        const permission = metaData?.permission
        resourceName = `Секретный каталог (${permission === 'read' ? 'Читать' : permission === 'included' ? 'Разместиться' : permission})`
      }

      return {
        id: a.id,
        userId: a.userId,
        user: userMap.get(a.userId) || { email: 'Неизвестно', fullName: null },
        resourceType: a.resourceType,
        resourceId: a.resourceId,
        resourceName,
        grantedBy: a.grantedBy,
        grantedAt: a.grantedAt,
        expiresAt: a.expiresAt,
        createdAt: a.createdAt,
        metaData: accessAny.metaData
      }
    })

    return {
      success: true,
      data: {
        accesses: formattedAccesses,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          total
        }
      }
    }
  } catch (error) {
    console.error('Error fetching user accesses:', error)
    return {
      success: false,
      error: 'Ошибка при загрузке доступов'
    }
  }
}

export async function grantAccess(formData: FormData) {
  try {
    const email = formData.get('email') as string
    const resourceType = formData.get('resourceType') as string
    let resourceId = formData.get('resourceId') as string
    const expiresAt = formData.get('expiresAt') as string
    const adminId = formData.get('adminId') as string
    const catalogPermission = formData.get('catalogPermission') as string

    // Для каталога resourceId может быть пустым - используем значение по умолчанию
    if (resourceType === 'catalog') {
      resourceId = 'secret-catalog'
    }

    if (!email || !resourceType || !adminId) {
      return { error: 'Не все поля заполнены' }
    }

    // Для страницы resourceId обязателен
    if (resourceType === 'page' && !resourceId) {
      return { error: 'Выберите секретную страницу' }
    }

    const emailHash = hashEmail(email.trim())
    const user = await prisma.user.findUnique({
      where: { emailHash },
      select: { id: true }
    })

    if (!user) {
      return { error: 'Пользователь не найден' }
    }

    const existing = await prisma.userAccess.findUnique({
      where: {
        userId_resourceType_resourceId: {
          userId: user.id,
          resourceType,
          resourceId
        }
      }
    })

    if (existing) {
      return { error: 'Доступ уже выдан' }
    }

    const accessData: any = {
      userId: user.id,
      resourceType,
      resourceId,
      grantedBy: `admin_${adminId}`,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    }

    // Для каталога сохраняем права в metaData
    if (resourceType === 'catalog' && catalogPermission) {
      accessData.metaData = { permission: catalogPermission }
    }

    await prisma.userAccess.create({
      data: accessData
    })

    revalidatePath('/admin/access')
    return { success: true }
  } catch (error) {
    console.error('Error granting access:', error)
    return { error: 'Ошибка при выдаче доступа' }
  }
}

export async function revokeAccess(id: string) {
  try {
    await prisma.userAccess.delete({
      where: { id }
    })

    revalidatePath('/admin/access')
    return { success: true }
  } catch (error) {
    console.error('Error revoking access:', error)
    return { error: 'Ошибка при отзыве доступа' }
  }
}

export async function getSecretPages() {
  try {
    const pages = await prisma.secretPage.findMany({
      select: {
        id: true,
        title: true,
        slug: true
      },
      orderBy: { title: 'asc' }
    })
    return { success: true, data: pages }
  } catch (error) {
    console.error('Error fetching secret pages:', error)
    return { success: false, error: 'Ошибка при загрузке страниц' }
  }
}