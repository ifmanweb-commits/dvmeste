// prisma/seed-fix-slugs.ts
// Скрипт для обновления существующих slug на латиницу
// Запуск: npx tsx prisma/seed-fix-slugs.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

function generateSlug(text: string, suffix: string = ''): string {
  const base = transliterate(text)
    .replace(/[^a-z0-9\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
  
  return suffix ? `${base}-${suffix}` : base
}

async function main() {
  console.log('🔧 Обновление slug на латиницу...\n')
  
  // Обновляем slug пользователей
  console.log('👤 Обновление slug пользователей...')
  const users = await prisma.user.findMany({
    where: {
      isAdmin: false,
      isManager: false
    },
    select: { id: true, fullName: true, slug: true }
  })
  
  let usersUpdated = 0
  for (const user of users) {
    if (user.fullName && user.fullName.trim()) {
      const [firstName, lastName] = user.fullName.split(' ')
      const newSlug = generateSlug(`${firstName}-${lastName}`)
      
      if (user.slug !== newSlug) {
        // Проверяем уникальность slug
        let finalSlug = newSlug
        let counter = 1
        while (await prisma.user.findUnique({ where: { slug: finalSlug } })) {
          finalSlug = `${newSlug}-${counter}`
          counter++
        }
        
        await prisma.user.update({
          where: { id: user.id },
          data: { slug: finalSlug }
        })
        console.log(`  ✓ ${user.fullName}: ${user.slug} → ${finalSlug}`)
        usersUpdated++
      }
    } else if (!user.slug || user.slug.includes('undefined') || /[а-яё]/i.test(user.slug)) {
      // Если нет fullName, используем часть email до @
      const emailPrefix = user.email.split('@')[0]
      const newSlug = generateSlug(emailPrefix)
      
      if (user.slug !== newSlug) {
        let finalSlug = newSlug
        let counter = 1
        while (await prisma.user.findUnique({ where: { slug: finalSlug } })) {
          finalSlug = `${newSlug}-${counter}`
          counter++
        }
        
        await prisma.user.update({
          where: { id: user.id },
          data: { slug: finalSlug }
        })
        console.log(`  ✓ ${user.email}: ${user.slug} → ${finalSlug}`)
        usersUpdated++
      }
    }
  }
  console.log(`  Обновлено: ${usersUpdated}\n`)
  
  // Обновляем slug статей
  console.log('📝 Обновление slug статей...')
  const articles = await prisma.article.findMany({
    select: { id: true, title: true, slug: true }
  })
  
  let articlesUpdated = 0
  for (const article of articles) {
    const newSlug = generateSlug(article.title, String(Math.floor(Math.random() * 9000) + 1000))
    
    if (article.slug !== newSlug) {
      // Проверяем уникальность slug
      let finalSlug = newSlug
      let counter = 1
      while (await prisma.article.findUnique({ where: { slug: finalSlug } })) {
        finalSlug = `${newSlug}-${counter}`
        counter++
      }
      
      await prisma.article.update({
        where: { id: article.id },
        data: { slug: finalSlug }
      })
      console.log(`  ✓ "${article.title.slice(0, 40)}...": ${article.slug.slice(0, 30)}... → ${finalSlug.slice(0, 30)}...`)
      articlesUpdated++
    }
  }
  console.log(`  Обновлено: ${articlesUpdated}\n`)
  
  console.log('='.repeat(50))
  console.log('✅ Обновление slug завершено!')
  console.log(`   Пользователей: ${usersUpdated}`)
  console.log(`   Статей: ${articlesUpdated}`)
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
