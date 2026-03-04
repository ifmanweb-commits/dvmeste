'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/require'
import { Prisma, PsychologistStatus } from '@prisma/client' // добавь PsychologistStatus

// ======================================
// ПОЛУЧЕНИЕ СПИСКОВ
// ======================================

export async function getPsychologistsList() {
  await requireAdmin()
  
  if (!prisma) return []
  
  try {
    const list = await prisma.user.findMany({
      where: {
        status: {
          in: [PsychologistStatus.ACTIVE, PsychologistStatus.REJECTED, PsychologistStatus.BLOCKED]
        }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        city: true,
        price: true,
        certificationLevel: true,
        status: true,
        isPublished: true,
        createdAt: true,
        slug: true,
        mainParadigm: true,
        contactInfo: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    
    return list.map(user => ({
      id: user.id,
      slug: user.slug,
      fullName: user.fullName || 'Без имени', // string | null -> string
      city: user.city,
      isPublished: user.isPublished,
      price: user.price,
      certificationLevel: user.certificationLevel?.toString(), // number -> string
    }))
  } catch (error) {
    console.error('Error fetching psychologists list:', error)
    return []
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
      status: 'CANDIDATE'
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
        price: true,
        certificationLevel: true,
        status: true,
        createdAt: true,
        workFormat: true,
        mainParadigm: true,
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

// ======================================
// ПОЛУЧЕНИЕ ОДНОГО ПОЛЬЗОВАТЕЛЯ
// ======================================

export async function getPsychologistById(id: string) {
  await requireAdmin()
  
  if (!prisma) return null

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        documents: {
          select: {
            id: true,
            type: true,
            filename: true,
            url: true,
            verifiedAt: true,
          },
        },
        articles: {
          where: { isPublished: true },
          select: {
            id: true,
            title: true,
            slug: true,
            publishedAt: true,
          },
        },
      },
    })

    return user
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

// ======================================
// ОБНОВЛЕНИЕ ПОЛЬЗОВАТЕЛЯ
// ======================================

export async function updatePsychologist(id: string, formData: FormData) {
  await requireAdmin()
  
  if (!prisma) return null

  try {
    // Извлекаем данные из FormData
    const fullName = formData.get('fullName') as string
    const slug = formData.get('slug') as string
    const gender = formData.get('gender') as string
    const birthDate = formData.get('birthDate') as string
    const city = formData.get('city') as string
    const workFormat = formData.get('workFormat') as string
    const firstDiplomaDate = formData.get('firstDiplomaDate') as string
    const lastCertificationDate = formData.get('lastCertificationDate') as string
    const certificationLevel = formData.get('certificationLevel') as string
    const shortBio = formData.get('shortBio') as string
    const longBio = formData.get('longBio') as string
    const price = formData.get('price') as string
    const contactInfo = formData.get('contactInfo') as string
    const status = formData.get('status') as string
    const isPublished = formData.get('isPublished') === 'on'
    const education = formData.get('education') as string
    
    // Парадигмы могут приходить как массив
    const mainParadigm = formData.getAll('mainParadigm') as string[]

    // Подготавливаем данные для обновления
    const data: any = {
      fullName: fullName || null,
      slug: slug || null,
      gender: gender || null,
      city: city || null,
      workFormat: workFormat || null,
      certificationLevel: certificationLevel ? parseInt(certificationLevel) : 0,
      shortBio: shortBio || null,
      longBio: longBio || null,
      price: price ? parseInt(price) : null,
      contactInfo: contactInfo || null,
      status: status || 'CANDIDATE',
      isPublished,
      mainParadigm: mainParadigm.length ? mainParadigm : [],
    }

    // Добавляем даты, если они есть
    if (birthDate) data.birthDate = new Date(birthDate)
    if (firstDiplomaDate) data.firstDiplomaDate = new Date(firstDiplomaDate)
    if (lastCertificationDate) data.lastCertificationDate = new Date(lastCertificationDate)
    
    // Добавляем образование, если есть
    if (education) {
      try {
        data.education = JSON.parse(education)
      } catch (e) {
        console.error('Error parsing education JSON:', e)
      }
    }

    // Обновляем пользователя
    const updated = await prisma.user.update({
      where: { id },
      data,
    })

    // ======================================
    // ОБРАБОТКА ФОТОГРАФИЙ (ДОКУМЕНТЫ)
    // ======================================
    
    const photoData = formData.get('photoData')
    if (photoData) {
      const { existing, new: newPhotos } = JSON.parse(photoData as string)
      
      // Удаляем фото, которых нет в existing
      const existingIds = existing.map((p: any) => p.id).filter(Boolean)
      if (existingIds.length > 0) {
        await prisma.document.deleteMany({
          where: {
            userId: id,
            type: 'PHOTO',
            NOT: { id: { in: existingIds } }
          }
        })
      } else {
        // Если нет существующих, удаляем все фото
        await prisma.document.deleteMany({
          where: {
            userId: id,
            type: 'PHOTO',
          }
        })
      }

      // Добавляем новые фото
      const files = formData.getAll('photos') as File[]
      
      for (let i = 0; i < newPhotos.length; i++) {
        const file = files[i]
        if (file) {
          // TODO: загрузить файл на сервер и получить URL
          // Пока сохраняем временный URL (нужно будет реализовать загрузку)
          const url = `/uploads/${Date.now()}-${file.name}`
          
          await prisma.document.create({
            data: {
              userId: id,
              type: 'PHOTO',
              url,
              filename: file.name,
              mimeType: file.type,
              size: file.size,
            }
          })
        }
      }
    }

    return updated
  } catch (error) {
    console.error('Error updating psychologist:', error)
    throw error
  }
}

// ======================================
// ОБНОВЛЕНИЕ СТАТУСА
// ======================================

export async function updatePsychologistStatus(id: string, status: 'CANDIDATE' | 'ACTIVE' | 'REJECTED' | 'BLOCKED') {
  await requireAdmin()
  
  if (!prisma) return null

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: { 
        status,
        ...(status === 'ACTIVE' && { isPublished: true }),
        ...(status !== 'ACTIVE' && status !== 'CANDIDATE' && { isPublished: false }),
      },
    })

    // Создаем запись в модерации
    if (status !== 'CANDIDATE') {
      const moderator = await requireAdmin()
      await prisma.moderationRecord.create({
        data: {
          userId: id,
          status: status === 'ACTIVE' ? 'APPROVED' : 'REVISION',
          comment: status === 'ACTIVE' 
            ? 'Заявка одобрена' 
            : 'Заявка отклонена',
          moderatorId: moderator.id,
        },
      })
    }

    return updated
  } catch (error) {
    console.error('Error updating user status:', error)
    return null
  }
}

// ======================================
// ПУБЛИКАЦИЯ/СКРЫТИЕ
// ======================================

export async function togglePsychologistPublish(id: string, publish: boolean) {
  await requireAdmin()
  
  if (!prisma) return null

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: { 
        isPublished: publish,
      },
    })
    
    return updated
  } catch (error) {
    console.error('Error toggling user publish:', error)
    return null
  }
}

// ======================================
// БЛОКИРОВКА/РАЗБЛОКИРОВКА
// ======================================

export async function togglePsychologistBlock(id: string, block: boolean) {
  await requireAdmin()
  
  if (!prisma) return null

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: { 
        status: block ? 'BLOCKED' : 'ACTIVE',
        isPublished: block ? false : true,
      },
    })

    return updated
  } catch (error) {
    console.error('Error toggling user block:', error)
    throw error
  }
}

// ======================================
// КОММЕНТАРИИ МОДЕРАЦИИ
// ======================================

export async function addModerationComment(userId: string, comment: string) {
  await requireAdmin()
  
  if (!prisma) return null

  try {
    const moderator = await requireAdmin()
    
    const record = await prisma.moderationRecord.create({
      data: {
        userId,
        status: 'REVISION',
        comment,
        moderatorId: moderator.id,
      },
    })

    return record
  } catch (error) {
    console.error('Error adding moderation comment:', error)
    return null
  }
}