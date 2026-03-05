// prisma/seed-blocks.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Запуск seed для блоков...')

  const defaultBlocks = [
    {
      slug: 'global-header',
      name: 'Глобальная шапка',
      description: 'Отображается на всех страницах сайта. Логотип, контакты, дополнительные элементы.',
      content: '<div class="global-header">Шапка сайта (настройте содержимое в админке)</div>',
      isActive: true,
    },
    {
      slug: 'global-footer',
      name: 'Глобальный подвал',
      description: 'Отображается на всех страницах сайта. Копирайт, соцсети, дополнительные ссылки.',
      content: '<footer class="global-footer">Подвал сайта (настройте содержимое в админке)</footer>',
      isActive: true,
    },
    {
      slug: 'catalog-header',
      name: 'Шапка каталога',
      description: 'Отображается только на страницах каталога. Промо-текст, баннеры, приветствие.',
      content: '<div class="catalog-header">Добро пожаловать в каталог психологов</div>',
      isActive: true,
    },
    {
      slug: 'catalog-footer',
      name: 'Подвал каталога',
      description: 'Отображается только на страницах каталога. Дополнительная информация, ссылки.',
      content: '<div class="catalog-footer">Подвал каталога</div>',
      isActive: true,
    },
    {
      slug: 'head-scripts',
      name: 'Скрипты в <head>',
      description: 'Код, который будет вставлен в <head> (метрики, аналитика, верификация)',
      content: '<!-- Сюда можно вставить код Яндекс.Метрики, Google Analytics и т.д. -->',
      isActive: false,
    },
    {
      slug: 'body-end',
      name: 'Скрипты перед </body>',
      description: 'Код, который будет вставлен перед закрывающим тегом body (чаты поддержки, ремаркетинг)',
      content: '<!-- Сюда можно вставить код чата поддержки -->',
      isActive: false,
    }
  ]

  for (const block of defaultBlocks) {
    await prisma.blocks.upsert({
      where: { slug: block.slug },
      update: {}, // ничего не обновляем, если уже есть
      create: block,
    })
    console.log(`  ✅ Блок ${block.slug} создан/проверен`)
  }

  console.log('✅ Seed для блоков завершен!')
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении блоков:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })