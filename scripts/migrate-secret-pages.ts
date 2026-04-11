import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Миграция SecretPage: обновление filePath...')

  // Находим все страницы с filePath, начинающимся с 'secret-pages/'
  const pages = await prisma.secretPage.findMany({
    where: {
      filePath: {
        startsWith: 'secret-pages/'
      }
    }
  })

  console.log(`Найдено страниц для обновления: ${pages.length}`)

  let updated = 0
  for (const page of pages) {
    const newFilePath = 'files/' + page.filePath
    await prisma.secretPage.update({
      where: { id: page.id },
      data: { filePath: newFilePath }
    })
    console.log(`Обновлено: ${page.slug} - ${page.filePath} -> ${newFilePath}`)
    updated++
  }

  console.log(`\n✅ Обновлено ${updated} записей`)
}

main()
  .catch((e) => {
    console.error('Ошибка:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })