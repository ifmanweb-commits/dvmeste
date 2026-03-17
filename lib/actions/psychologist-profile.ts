'use server'

import { prisma } from '@/lib/prisma'
import { requirePsychologist } from '@/lib/auth/require'
import { revalidatePath } from 'next/cache'
import { DocumentType } from '@prisma/client'

export async function updatePsychologistProfile(userId: string, formData: FormData) {
  await requirePsychologist()

  if (!prisma) {
    throw new Error('Database connection not available')
  }

  try {
    const rawMainParadigm = formData.get('mainParadigm') as string
    let mainParadigm: string[] = []
    try {
      mainParadigm = rawMainParadigm ? JSON.parse(rawMainParadigm) : []
    } catch (e) {
      mainParadigm = []
    }

    const data = {
      fullName: (formData.get('fullName') as string) || null,
      slug: (formData.get('slug') as string) || null,
      city: (formData.get('city') as string) || null,
      gender: (formData.get('gender') as string) || null,
      workFormat: (formData.get('workFormat') as string) || null,
      shortBio: (formData.get('shortBio') as string) || null,
      longBio: (formData.get('longBio') as string) || null,
      contactInfo: (formData.get('contactInfo') as string) || null,
      price: formData.get('price') ? Number(formData.get('price')) : null,
      freeSession: formData.get('freeSession') ? Number(formData.get('freeSession')) : 0,
      certificationLevel: formData.get('certificationLevel') ? Number(formData.get('certificationLevel')) : 0,
      birthDate: formData.get('birthDate') ? new Date(formData.get('birthDate') as string) : null,
      firstDiplomaDate: formData.get('firstDiplomaDate') ? new Date(formData.get('firstDiplomaDate') as string) : null,
      lastCertificationDate: formData.get('lastCertificationDate') ? new Date(formData.get('lastCertificationDate') as string) : null,
      mainParadigm: mainParadigm,
      hasUnpublishedChanges: true,
    }

    await prisma.user.update({
      where: { id: userId },
      data,
    })

    revalidatePath('/account/profile')
    revalidatePath('/catalog')
    revalidatePath('/catalog/[slug]')
  } catch (error) {
    console.error('Error updating psychologist profile:', error)
    throw error
  }
}
