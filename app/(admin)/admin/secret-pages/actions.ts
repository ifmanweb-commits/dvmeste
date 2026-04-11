'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { writeFile, mkdir, rm, readdir, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function createSecretPage(formData: FormData) {
  const slug = formData.get('slug') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const htmlFile = formData.get('htmlFile') as File
  const imageFiles = formData.getAll('images') as File[]

  // Проверка уникальности slug
  const existing = await prisma.secretPage.findUnique({ where: { slug } })
  if (existing) {
    throw new Error('Страница с таким slug уже существует')
  }

  // Валидация slug (латиница, буквы/цифры/дефис)
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  if (!slugRegex.test(slug)) {
    throw new Error('Slug должен содержать только латинские буквы, цифры и дефисы')
  }

  if (!htmlFile || htmlFile.size === 0) {
    throw new Error('Необходимо загрузить HTML файл')
  }

  // Создаём папку для страницы в public/files/secret-pages/
  const pageDir = join(process.cwd(), 'public', 'files', 'secret-pages', slug)
  const imagesDir = join(pageDir, 'images')

  await mkdir(pageDir, { recursive: true })
  await mkdir(imagesDir, { recursive: true })

  // Читаем HTML файл
  const htmlContent = await htmlFile.text()

  // Обрабатываем изображения в HTML
  let processedHtml = htmlContent

  // Находим все img src с абсолютными URL
  const imgSrcRegex = /<img([^>]*)\s+src=["']([^"']+)["']([^>]*)>/gi
  const externalUrls = new Set<string>()

  let match
  while ((match = imgSrcRegex.exec(htmlContent)) !== null) {
    const src = match[2]
    if (src.startsWith('http://') || src.startsWith('https://')) {
      externalUrls.add(src)
    }
  }

  // Скачиваем внешние изображения и заменяем пути
  const downloadedImages = new Map<string, string>()

  for (const url of externalUrls) {
    try {
      const response = await fetch(url)
      if (!response.ok) continue

      const contentType = response.headers.get('content-type') || 'image/jpeg'
      const extension = contentType.split('/')[1] || 'jpg'
      const filename = `img_${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`
      const imagePath = join(imagesDir, filename)

      const buffer = Buffer.from(await response.arrayBuffer())
      await writeFile(imagePath, buffer)

      const relativePath = `/files/secret-pages/${slug}/images/${filename}`
      downloadedImages.set(url, relativePath)
    } catch (e) {
      console.error(`Failed to download image ${url}:`, e)
    }
  }

  // Заменяем URL в HTML
  for (const [url, relativePath] of downloadedImages) {
    processedHtml = processedHtml.replace(new RegExp(url, 'g'), relativePath)
  }

  // Сохраняем HTML
  await writeFile(join(pageDir, 'index.html'), processedHtml)

  // Сохраняем загруженные изображения
  const savedImages: string[] = []
  for (const file of imageFiles) {
    if (file && file.size > 0) {
      const filename = file.name
      const imagePath = join(imagesDir, filename)
      const buffer = Buffer.from(await file.arrayBuffer())
      await writeFile(imagePath, buffer)
      savedImages.push(`/files/secret-pages/${slug}/images/${filename}`)
    }
  }

  // Создаём запись в БД
  await prisma.secretPage.create({
    data: {
      slug,
      title,
      description: description || null,
      filePath: `files/secret-pages/${slug}/index.html`,
      isActive: true,
    },
  })

  revalidatePath('/admin/secret-pages')
  redirect('/admin/secret-pages')
}

export async function updateSecretPage(id: string, formData: FormData) {
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const htmlFile = formData.get('htmlFile') as File | null
  const imageFiles = formData.getAll('images') as File[]
  const deleteImages = formData.get('deleteImages') as string | null

  const page = await prisma.secretPage.findUnique({ where: { id } })
  if (!page) {
    return { error: 'Страница не найдена' }
  }

  const pageDir = join(process.cwd(), 'public', 'files', 'secret-pages', page.slug)
  const imagesDir = join(pageDir, 'images')

  // Обновляем HTML если загружен новый файл
  if (htmlFile && htmlFile.size > 0) {
    let htmlContent = await htmlFile.text()

    // Обрабатываем внешние изображения
    const imgSrcRegex = /<img([^>]*)\s+src=["']([^"']+)["']([^>]*)>/gi
    const externalUrls = new Set<string>()

    let match
    while ((match = imgSrcRegex.exec(htmlContent)) !== null) {
      const src = match[2]
      if (src.startsWith('http://') || src.startsWith('https://')) {
        externalUrls.add(src)
      }
    }

    for (const url of externalUrls) {
      try {
        const response = await fetch(url)
        if (!response.ok) continue

        const contentType = response.headers.get('content-type') || 'image/jpeg'
        const extension = contentType.split('/')[1] || 'jpg'
        const filename = `img_${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`
        const imagePath = join(imagesDir, filename)

        const buffer = Buffer.from(await response.arrayBuffer())
        await writeFile(imagePath, buffer)

        const relativePath = `/files/secret-pages/${page.slug}/images/${filename}`
        htmlContent = htmlContent.replace(new RegExp(url, 'g'), relativePath)
      } catch (e) {
        console.error(`Failed to download image ${url}:`, e)
      }
    }

    await writeFile(join(pageDir, 'index.html'), htmlContent)
  }

  // Сохраняем новые изображения
  for (const file of imageFiles) {
    if (file && file.size > 0) {
      const filename = file.name
      const imagePath = join(imagesDir, filename)
      const buffer = Buffer.from(await file.arrayBuffer())
      await writeFile(imagePath, buffer)
    }
  }

  // Удаляем указанные изображения
  if (deleteImages && deleteImages.trim() !== '') {
    const imagesToDelete = deleteImages.split(',')
    for (const imgPath of imagesToDelete) {
      if (imgPath && imgPath.trim() !== '') {
        // Извлекаем имя файла из полного пути (например, /files/secret-pages/slug/images/filename.jpg -> filename.jpg)
        const filename = imgPath.split('/').pop()
        if (filename) {
          const imagePath = join(imagesDir, filename)
          if (existsSync(imagePath)) {
            await unlink(imagePath)
          }
        }
      }
    }
  }

  // Обновляем БД
  await prisma.secretPage.update({
    where: { id },
    data: {
      title,
      description: description || null,
    },
  })

  revalidatePath('/admin/secret-pages')
  redirect('/admin/secret-pages')
}

export async function deleteSecretPage(id: string) {
  const page = await prisma.secretPage.findUnique({ where: { id } })
  if (!page) {
    return { error: 'Страница не найдена' }
  }

  const pageDir = join(process.cwd(), 'public', 'files', 'secret-pages', page.slug)

  // Удаляем папку рекурсивно
  if (existsSync(pageDir)) {
    await rm(pageDir, { recursive: true, force: true })
  }

  // Сначала удаляем все записи о доступе к этой странице (каскад)
  await prisma.userAccess.deleteMany({
    where: {
      resourceType: 'page',
      resourceId: id
    }
  })

  // Удаляем запись из БД
  await prisma.secretPage.delete({ where: { id } })

  revalidatePath('/admin/secret-pages')
}

export async function getSecretPageImages(slug: string): Promise<string[]> {
  const imagesDir = join(process.cwd(), 'public', 'files', 'secret-pages', slug, 'images')

  if (!existsSync(imagesDir)) {
    return []
  }

  try {
    const files = await readdir(imagesDir)
    return files
      .filter(f => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f))
      .map(f => `/files/secret-pages/${slug}/images/${f}`)
  } catch {
    return []
  }
}