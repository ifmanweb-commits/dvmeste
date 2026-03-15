// prisma/seed-datalists.ts
// Скрипт для восстановления стандартных списков (парадигмы, теги статей)
// Запуск: npx tsx prisma/seed-datalists.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Стандартные парадигмы (из текущей БД)
const paradigms = [
  "Консультирование",
  "КПТ",
  "Гештальт-терапия",
  "Психодинамическая терапия",
  "Экзистенциальная терапия",
  "Семейная системная терапия",
  "Транзактный анализ",
  "Схема-терапия",
  "ACT",
  "CFT",
  "DBT",
  "EMDR",
  "MBCT",
  "Телесно-ориентированная психотерапия",
  "Арт-терапия",
  "Эриксоновская терапия",
  "Клиент-центрированная терапия"
]

// Теги для статей (~15 штук)
const articleTags = [
  "Психология",
  "Психотерапия",
  "Тревога",
  "Депрессия",
  "Отношения",
  "Семья",
  "Самооценка",
  "Стресс",
  "Выгорание",
  "Травма",
  "КПТ",
  "Гештальт",
  "Психоанализ",
  "Родительство",
  "Личный рост"
]

async function main() {
  console.log('🌱 Запуск seed для DataList...\n')

  // Парадигмы
  console.log('📋 Обновление парадигм...')
  const paradigmsList = await prisma.dataList.upsert({
    where: { slug: 'paradigms' },
    update: { 
      title: 'Парадигмы',
      items: paradigms 
    },
    create: {
      slug: 'paradigms',
      title: 'Парадигмы',
      items: paradigms
    }
  })
  console.log(`  ✅ Парадигмы: ${paradigmsList.items.length} элементов`)

  // Теги статей
  console.log('\n🏷️  Обновление тегов статей...')
  const tagsList = await prisma.dataList.upsert({
    where: { slug: 'article-tags' },
    update: { 
      title: 'Тэги статей',
      items: articleTags 
    },
    create: {
      slug: 'article-tags',
      title: 'Тэги статей',
      items: articleTags
    }
  })
  console.log(`  ✅ Теги статей: ${tagsList.items.length} элементов`)

  console.log('\n✅ Seed для DataList завершен!')
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении DataList:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
