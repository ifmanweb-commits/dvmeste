// prisma/seed-users.ts
// Скрипт для создания тестовых пользователей с документами и аватарками
// Запуск: npx tsx prisma/seed-users.ts

import { PrismaClient, PsychologistStatus, DocumentType } from '@prisma/client'
import { promises as fs } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

// Фотографии из папки tmp-photos
const photoFiles = [
  "baiburina.jpg",
  "baksheeva.jpg",
  "efimenko.jpg",
  "feoktistova.jpg",
  "fomina.jpg",
  "kapustina.jpg",
  "konnova.jpg",
  "kozireva.JPG",
  "krasnogorskaya.jpeg",
  "serova.jpg",
  "solodova.jpg",
  "storchak.webp",
  "tretyakov.jpg"
]

// Email пользователей, которых НЕ нужно удалять
const protectedEmails = [
  'ifman@yandex.ru',
  'psy@ya.ru',
  'pupa@ya.ru'
]

// Данные для генерации
const firstNames = [
  "Анна", "Мария", "Елена", "Ольга", "Наталья", "Ирина", "Екатерина", "Татьяна",
  "Александр", "Дмитрий", "Сергей", "Андрей", "Михаил", "Павел", "Игорь", "Константин"
]

const lastNames = [
  "Иванова", "Петрова", "Сидорова", "Смирнова", "Козлова", "Новикова", "Морозова", "Попова",
  "Иванов", "Петров", "Сидоров", "Смирнов", "Козлов", "Новиков", "Морозов", "Попов"
]

const cities = [
  "Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург", "Казань",
  "Нижний Новгород", "Челябинск", "Самара", "Омск", "Ростов-на-Дону",
  "Уфа", "Красноярск", "Воронеж", "Пермь", "Волгоград"
]

const paradigms = [
  "Когнитивно-поведенческая терапия",
  "Психоанализ",
  "Гештальт-терапия",
  "Системная семейная терапия",
  "Телесно-ориентированная терапия",
  "Арт-терапия",
  "Экзистенциальная терапия",
  "Клиент-центрированная терапия"
]

const workFormats = ["ONLINE", "OFFLINE", "BOTH"]

const shortBios = [
  "Помогаю справиться с тревогой, депрессией и проблемами в отношениях. Индивидуальный подход к каждому клиенту.",
  "Работаю с вопросами самооценки, выгорания и жизненных кризисов. Более 5 лет практики.",
  "Специализируюсь на семейной терапии и вопросах родительства. Создаю безопасное пространство для диалога.",
  "Помогаю найти внутренние ресурсы и преодолеть жизненные трудности. Работаю в подходе КПТ.",
  "Работаю с травмой, ПТСР и сложными эмоциональными состояниями. Бережный и поддерживающий подход.",
  "Консультирую по вопросам профориентации, карьеры и самоопределения. Экзистенциальный подход.",
  "Помогаю наладить отношения с партнёром и близкими. Системная семейная терапия.",
  "Специализируюсь на работе с детско-родительскими отношениями и возрастными кризисами."
]

// Вспомогательные функции
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Транслитерация кириллицы в латиницу
function transliterate(text: string): string {
  const ruToEn: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
    'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    ' ': '-', '_': '-', '/': '-'
  }
  
  return text.toLowerCase().split('').map(char => ruToEn[char] || char).join('')
}

function generateSlug(name: string): string {
  // Сначала транслитерируем, затем удаляем всё кроме латиницы, цифр и минуса
  return transliterate(name)
    .replace(/[^a-z0-9\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
}

// Копирование файла
async function copyFile(src: string, dest: string): Promise<void> {
  try {
    await fs.copyFile(src, dest)
    console.log(`  📁 Скопировано: ${src} → ${dest}`)
  } catch (error) {
    console.error(`  ❌ Ошибка копирования ${src}:`, error)
    throw error
  }
}

// Создание директории
async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true })
}

// Очистка данных
async function clearExistingData() {
  console.log('🧹 Очистка существующих данных...\n')

  // Удаляем документы тестовых пользователей
  const testUsers = await prisma.user.findMany({
    where: {
      isAdmin: false,
      isManager: false,
      email: {
        notIn: protectedEmails
      }
    },
    select: { id: true }
  })

  const testUserIds = testUsers.map(u => u.id)

  if (testUserIds.length > 0) {
    await prisma.document.deleteMany({
      where: {
        userId: { in: testUserIds }
      }
    })
  }

  // Удаляем статьи тестовых пользователей
  await prisma.article.deleteMany({
    where: {
      userId: { in: testUserIds }
    }
  })

  // Удаляем записи модерации
  await prisma.moderationRecord.deleteMany({
    where: {
      userId: { in: testUserIds }
    }
  })

  // Удаляем сессии
  await prisma.session.deleteMany({
    where: {
      userId: { in: testUserIds }
    }
  })

  // Удаляем тестовых пользователей (не админов и не менеджеров, и не из protected)
  await prisma.user.deleteMany({
    where: {
      isAdmin: false,
      isManager: false,
      email: {
        notIn: protectedEmails
      }
    }
  })

  console.log('✅ Очистка завершена\n')
}

// Создание пользователя
async function createUser(data: any) {
  const user = await prisma.user.create({ data })
  
  // Копируем аватарку если указана
  if (data.avatarUrl && data.avatarUrl.startsWith('/files/users/')) {
    const fileName = data.avatarUrl.split('/').pop()
    if (fileName) {
      const srcPath = join(process.cwd(), 'tmp-photos', fileName)
      const destDir = join(process.cwd(), 'public', 'files', 'users', user.id, 'photo')
      const destPath = join(destDir, fileName)
      
      await ensureDir(destDir)
      await copyFile(srcPath, destPath)
      
      // Обновляем avatarUrl с правильным ID
      await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl: `/files/users/${user.id}/photo/${fileName}` }
      })
    }
  }
  
  return user
}

// Создание документа для пользователя
async function createDocument(userId: string, type: DocumentType, fileName: string, description?: string) {
  const srcPath = join(process.cwd(), 'tmp-photos', fileName)
  const destDir = join(process.cwd(), 'public', 'files', 'users', userId, 'doc')
  const destPath = join(destDir, fileName)
  
  await ensureDir(destDir)
  await copyFile(srcPath, destPath)
  
  const stat = await fs.stat(destPath)
  
  return prisma.document.create({
    data: {
      userId,
      type,
      url: `/files/users/${userId}/doc/${fileName}`,
      filename: fileName,
      mimeType: fileName.endsWith('.webp') ? 'image/webp' : fileName.endsWith('.jpeg') ? 'image/jpeg' : 'image/jpeg',
      size: stat.size,
      description
    }
  })
}

// Генерация ACTIVE пользователей
async function seedActiveUsers() {
  console.log('🟢 Создание ACTIVE пользователей...\n')
  
  const activeCount = 10
  const users = []
  
  for (let i = 0; i < activeCount; i++) {
    const firstName = randomElement(firstNames)
    const lastName = randomElement(lastNames)
    const fullName = `${firstName} ${lastName}`
    const email = `active${i + 1}@test.local`
    const city = randomElement(cities)
    const paradigmsCount = randomInt(1, 3)
    const selectedParadigms: string[] = []
    const paradigmsCopy = [...paradigms]
    
    for (let j = 0; j < paradigmsCount; j++) {
      const idx = Math.floor(Math.random() * paradigmsCopy.length)
      selectedParadigms.push(paradigmsCopy.splice(idx, 1)[0])
    }
    
    const diplomaYear = randomInt(2015, 2023)
    const diplomaMonth = randomInt(1, 12)
    const photoFile = photoFiles[i % photoFiles.length]
    
    const user = await createUser({
      email,
      emailVerified: new Date(),
      fullName,
      slug: generateSlug(fullName) + "-" + randomInt(1, 99),
      status: PsychologistStatus.ACTIVE,
      isPublished: true,
      gender: randomElement(["Женский", "Мужской"]),
      birthDate: new Date(randomInt(1975, 1995), randomInt(0, 11), randomInt(1, 28)),
      city,
      workFormat: randomElement(workFormats),
      mainParadigm: selectedParadigms,
      certificationLevel: randomInt(1, 3),
      firstDiplomaDate: new Date(diplomaYear, diplomaMonth - 1, randomInt(1, 28)),
      lastCertificationDate: new Date(randomInt(2022, 2025), randomInt(0, 11), randomInt(1, 28)),
      shortBio: randomElement(shortBios),
      longBio: `<p>${randomElement(shortBios)}</p><p>Прошла много дополнительного обучения и супервизий.</p>`,
      price: randomInt(2000, 8000),
      contactInfo: `Telegram: @psych${i + 1}\nWhatsApp: +7 (999) ${randomInt(100, 999)}-${randomInt(10, 99)}-${randomInt(10, 99)}`,
      avatarUrl: `/files/users/placeholder/photo/${photoFile}` // Будет обновлён после копирования
    })
    
    // Создаём документы
    // Обязательно: хотя бы один ACADEMIC_EDUCATION
    await createDocument(
      user.id,
      DocumentType.ACADEMIC_EDUCATION,
      photoFiles[(i + 1) % photoFiles.length],
      "Диплом о высшем образовании"
    )
    
    // Дополнительные документы (случайно)
    const extraDocTypes: DocumentType[] = [DocumentType.PROFESSIONAL_TRAINING, DocumentType.COURSE]
    const extraDocsCount = randomInt(1, 3)
    
    for (let j = 0; j < extraDocsCount; j++) {
      const docType = randomElement(extraDocTypes)
      await createDocument(
        user.id,
        docType,
        photoFiles[(i + j + 2) % photoFiles.length],
        docType === DocumentType.PROFESSIONAL_TRAINING ? "Сертификат о переподготовке" : "Сертификат о курсах"
      )
    }
    
    // Фото анкеты (PHOTO) - 1-3 шт
    const photoCount = randomInt(1, 3)
    for (let j = 0; j < photoCount; j++) {
      await createDocument(
        user.id,
        DocumentType.PHOTO,
        photoFiles[(i + j) % photoFiles.length],
        j === 0 ? "Основное фото анкеты" : `Дополнительное фото ${j + 1}`
      )
    }
    
    users.push(user)
    console.log(`  ✓ ACTIVE: ${fullName} (${city}) - ${email}\n`)
  }
  
  return users
}

// Генерация CANDIDATE пользователей
async function seedCandidateUsers() {
  console.log('🟡 Создание CANDIDATE пользователей...\n')
  
  const candidateCount = 6
  const users = []
  
  for (let i = 0; i < candidateCount; i++) {
    const firstName = randomElement(firstNames)
    const lastName = randomElement(lastNames)
    const fullName = `${firstName} ${lastName}`
    const email = `candidate${i + 1}@test.local`
    const photoFile = photoFiles[(10 + i) % photoFiles.length]
    
    const user = await createUser({
      email,
      emailVerified: null,
      fullName,
      slug: generateSlug(fullName) + "-" + randomInt(1, 99),
      status: PsychologistStatus.CANDIDATE,
      isPublished: false,
      gender: randomElement(["Женский", "Мужской"]),
      city: randomElement(cities),
      workFormat: randomElement(workFormats),
      mainParadigm: [randomElement(paradigms)],
      certificationLevel: 0,
      shortBio: randomElement(shortBios),
      price: randomInt(1500, 4000),
      contactInfo: `Email: candidate${i + 1}@test.local`,
      avatarUrl: `/files/users/placeholder/photo/${photoFile}`
    })
    
    users.push(user)
    console.log(`  ✓ CANDIDATE: ${fullName} - ${email}\n`)
  }
  
  return users
}

// Генерация PENDING пользователей
async function seedPendingUsers() {
  console.log('⏳ Создание PENDING пользователей...\n')
  
  const pendingCount = 1
  const users = []
  
  for (let i = 0; i < pendingCount; i++) {
    const firstName = randomElement(firstNames)
    const lastName = randomElement(lastNames)
    const fullName = `${firstName} ${lastName}`
    const email = `pending${i + 1}@test.local`
    
    const user = await createUser({
      email,
      fullName,
      slug: generateSlug(fullName) + "-" + randomInt(1, 99),
      status: PsychologistStatus.PENDING,
      isPublished: false,
      city: randomElement(cities),
      workFormat: randomElement(workFormats),
      mainParadigm: [randomElement(paradigms)],
      certificationLevel: 0,
      shortBio: randomElement(shortBios),
      price: randomInt(1000, 3000),
      contactInfo: `Телефон: +7 (999) ${randomInt(100, 999)}-${randomInt(10, 99)}-${randomInt(10, 99)}`
    })
    
    users.push(user)
    console.log(`  ✓ PENDING: ${fullName} - ${email}\n`)
  }
  
  return users
}

// Генерация REJECTED пользователей
async function seedRejectedUsers() {
  console.log('🔴 Создание REJECTED пользователей...\n')
  
  const rejectedCount = 1
  const users = []
  
  for (let i = 0; i < rejectedCount; i++) {
    const firstName = randomElement(firstNames)
    const lastName = randomElement(lastNames)
    const fullName = `${firstName} ${lastName}`
    const email = `rejected${i + 1}@test.local`
    
    const user = await createUser({
      email,
      fullName,
      slug: generateSlug(fullName) + "-" + randomInt(1, 99),
      status: PsychologistStatus.REJECTED,
      isPublished: false,
      city: randomElement(cities),
      workFormat: "ONLINE",
      mainParadigm: [randomElement(paradigms)],
      certificationLevel: randomInt(0, 1),
      shortBio: randomElement(shortBios),
      price: randomInt(1000, 2500),
      contactInfo: `Email: rejected${i + 1}@test.local`
    })
    
    users.push(user)
    console.log(`  ✓ REJECTED: ${fullName} - ${email}\n`)
  }
  
  return users
}

// Генерация BLOCKED пользователей
async function seedBlockedUsers() {
  console.log('🚫 Создание BLOCKED пользователей...\n')
  
  const blockedCount = 1
  const users = []
  
  for (let i = 0; i < blockedCount; i++) {
    const firstName = randomElement(firstNames)
    const lastName = randomElement(lastNames)
    const fullName = `${firstName} ${lastName}`
    const email = `blocked${i + 1}@test.local`
    const photoFile = photoFiles[(10 + i) % photoFiles.length]
    
    const user = await createUser({
      email,
      fullName,
      slug: generateSlug(fullName) + "-" + randomInt(1, 99),
      status: PsychologistStatus.BLOCKED,
      isPublished: false,
      city: randomElement(cities),
      workFormat: "ONLINE",
      mainParadigm: [randomElement(paradigms)],
      certificationLevel: randomInt(1, 2),
      shortBio: randomElement(shortBios),
      price: randomInt(2000, 5000),
      avatarUrl: `/files/users/placeholder/photo/${photoFile}`
    })
    
    users.push(user)
    console.log(`  ✓ BLOCKED: ${fullName} - ${email}\n`)
  }
  
  return users
}

// Основная функция
async function main() {
  console.log('🌱 Запуск сидирования пользователей...\n')
  
  await clearExistingData()
  
  const activeUsers = await seedActiveUsers()
  const candidateUsers = await seedCandidateUsers()
  const pendingUsers = await seedPendingUsers()
  const rejectedUsers = await seedRejectedUsers()
  const blockedUsers = await seedBlockedUsers()
  
  const allUsers = [...activeUsers, ...candidateUsers, ...pendingUsers, ...rejectedUsers, ...blockedUsers]
  
  console.log('\n' + '='.repeat(50))
  console.log('✅ Seed для пользователей завершен!')
  console.log(`   ACTIVE: ${activeUsers.length}`)
  console.log(`   CANDIDATE: ${candidateUsers.length}`)
  console.log(`   PENDING: ${pendingUsers.length}`)
  console.log(`   REJECTED: ${rejectedUsers.length}`)
  console.log(`   BLOCKED: ${blockedUsers.length}`)
  console.log(`   ВСЕГО: ${allUsers.length}`)
  console.log('='.repeat(50))
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
