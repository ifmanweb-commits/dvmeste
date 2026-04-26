// prisma/seed-initial.ts
// Единый сид-скрипт для первоначального наполнения базы при деплое
// Запуск: npx tsx prisma/seed-initial.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Запуск начального сидирования...\n')

  // ============================================
  // 1. СУПЕРАДМИН
  // ============================================
  console.log('👤 Создание суперадмина...')
  
  await prisma.user.upsert({
    where: { email: 'ifman@yandex.ru' },
    update: {},
    create: {
      email: 'ifman@yandex.ru',
      emailVerified: new Date(),
      fullName: 'Сергей Смирнов',
      isAdmin: true,
    },
  })
  console.log('  ✅ Суперадмин ifman@yandex.ru создан/проверен')

  // ============================================
  // 2. BLOCKS (6 записей)
  // ============================================
  console.log('\n📦 Таблица Blocks...')

  const blocks = [
    {
      slug: 'head-scripts',
      name: 'Скрипты в <head>',
      content: '<!-- Сюда можно вставить код Яндекс.Метрики, Google Analytics и т.д. -->\n',
      description: 'Код, который будет вставлен в <head> (метрики, аналитика, верификация)',
      isActive: true,
      isScript: true,
      inHead: true,
      order: 0,
    },
    {
      slug: 'global-header',
      name: 'Глобальная шапка',
      content: '<div class="global-header">Шапка сайта (настройте содержимое в админке)</div>',
      description: 'Отображается на всех страницах сайта. Логотип, контакты, дополнительные элементы.',
      isActive: false,
      isScript: false,
      inHead: false,
      order: 2,
    },
    {
      slug: 'catalog-header',
      name: 'Шапка каталога',
      content: '<section class="catalog-header relative overflow-hidden border-b border-gray-200 bg-white ">\n  <div class="absolute left-0 top-0 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5858E2]/10 blur-3xl" aria-hidden="true"></div>\n  <div class="absolute right-0 bottom-0 h-48 w-48 translate-x-1/2 translate-y-1/2 rounded-full bg-lime-500/10 blur-3xl" aria-hidden="true"></div>\n  <div class="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">\n    <div class="text-center">\n      <h1 class="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">\n        Найдите <span class="text-[#5858E2]">психолога</span>\n      </h1>\n      <p class="mx-auto mt-6 max-w-2xl text-lg text-gray-700">\n        Подбор специалистов по направлениям терапии, стоимости и опыту работы\n      </p>\n    </div>\n  </div>\n</section>',
      description: 'Отображается только на страницах каталога. Промо-текст, баннеры, приветствие.',
      isActive: false,
      isScript: false,
      inHead: false,
      order: 9,
    },
    {
      slug: 'catalog-footer',
      name: 'Подвал каталога',
      content: '<section class="catalog-footer border-t border-gray-200 bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8">\n  <div class="mx-auto grid max-w-7xl gap-8 lg:grid-cols-3">\n    <div class="rounded-2xl border border-gray-200 bg-gray-50 p-6">\n      <h3 class="text-lg font-semibold text-gray-900">Проверенные специалисты</h3>\n      <p class="mt-2 text-sm text-gray-600">\n        В каталоге нет психологов, не сдавших наши экзамены и не подтвердивших соответствие уровню квалификации.\n      </p>\n    </div>\n    <div class="rounded-2xl border border-gray-200 bg-gray-50 p-6">\n      <h3 class="text-lg font-semibold text-gray-900">Уровни квалификации</h3>\n      <p class="mt-2 text-sm text-gray-600">\n        Чем выше уровень квалификации психолога - тем эффективнее работа с ним. \n      </p>\n    </div>\n    <div class="rounded-2xl border border-gray-200 bg-gray-50 p-6">\n      <h3 class="text-lg font-semibold text-gray-900">Без комиссии</h3>\n      <p class="mt-2 text-sm text-gray-600">\n        Мы не берем комиссию за обращение к психологу, вы договариваетесь с ним индивидуально и оплачиваете на его условиях и указанным им методом.\n      </p>\n    </div>\n  </div>\n</section>',
      description: 'Отображается только на страницах каталога. Дополнительная информация, ссылки.',
      isActive: true,
      isScript: false,
      inHead: false,
      order: 10,
    },
    {
      slug: 'body-end',
      name: 'Скрипты перед </body>',
      content: '<!-- Сюда можно вставить код чата поддержки -->',
      description: 'Код, который будет вставлен перед закрывающим тегом body (чаты поддержки, ремаркетинг)',
      isActive: true,
      isScript: false,
      inHead: false,
      order: 19,
    },
    {
      slug: 'global-footer',
      name: 'Глобальный подвал',
      content: '<div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">\n  <div class="flex flex-col items-center gap-6 sm:flex-row sm:justify-between sm:gap-8">\n    <div class="text-center sm:text-left">\n      <div class="text-xl font-bold text-gray-900">Давай вместе</div>\n      <div class="mt-1 text-xs font-medium text-lime-600">реестр проверенных психологов</div>\n    </div>\n\n    <nav class="flex flex-wrap justify-center gap-6">\n      <a href="/" class="text-sm text-gray-600 hover:text-gray-900">Главная</a>\n      <a href="/catalog" class="text-sm text-gray-600 hover:text-gray-900">Подобрать психолога</a>\n      <a href="/articles" class="text-sm text-gray-600 hover:text-gray-900">Статьи</a>\n      <a href="/connect" class="text-sm text-gray-600 hover:text-gray-900">Для психологов</a>\n    </nav>\n  </div>\n\n  <div class="my-6 h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>\n\n  <div class="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">\n    <div class="flex flex-wrap justify-center gap-4 text-xs">\n      <a href="/privacy" class="text-gray-500 hover:text-gray-700">Конфиденциальность</a>\n      <a href="/faq" class="text-gray-500 hover:text-gray-700">FAQ</a>\n    </div>\n\n    <div class="text-center sm:text-right">\n      <p class="text-xs text-gray-500">© 2026 Давай вместе. Каталог психологов!</p>\n      <p class="mt-1 text-xs text-gray-400">Прямая связь с психологами без комиссии. ^_^</p>\n    </div>\n  </div>\n\n  <div class="mt-6 flex justify-center">\n    <div class="flex items-center gap-2">\n      <div class="h-px w-4 bg-gray-300"></div>\n      <div class="h-1 w-1 rounded-full bg-lime-500"></div>\n      <div class="h-px w-4 bg-gray-300"></div>\n    </div>\n  </div>\n</div>',
      description: 'Отображается на всех страницах сайта. Копирайт, соцсети, дополнительные ссылки.',
      isActive: true,
      isScript: false,
      inHead: false,
      order: 20,
    },
  ]

  for (const block of blocks) {
    await prisma.blocks.upsert({
      where: { slug: block.slug },
      update: {},
      create: block,
    })
    console.log(`  ✅ Блок ${block.slug} создан/проверен`)
  }

  // ============================================
  // 3. DATALIST (5 записей)
  // ============================================
  console.log('\n📋 Таблица DataList...')

  const dataLists = [
    {
      slug: 'article-tags',
      title: 'Тэги статей',
      items: [
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
      ],
    },
    {
      slug: 'certification-levels',
      title: 'Уровни сертификации',
      items: ["1", "2", "3"],
    },
    {
      slug: 'paradigms',
      title: 'Парадигмы',
      items: [
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
      ],
    },
    {
      slug: 'site-header-menu',
      title: 'Site Header Menu',
      items: [
        {
          id: "menu-psy-list",
          label: "Подобрать психолога",
          href: "/catalog"
        },
        {
          id: "menu-lib-articles",
          label: "Статьи",
          href: "/articles"
        },
        {
          id: "menu-connect",
          label: "Для психологов",
          href: "/connect"
        }
      ],
    },
    {
      slug: 'work-formats',
      title: 'Форматы работы',
      items: [
        "Онлайн и оффлайн",
        "Только онлайн",
        "Только оффлайн",
        "Переписка"
      ],
    },
  ]

  for (const data of dataLists) {
    await prisma.dataList.upsert({
      where: { slug: data.slug },
      update: {},
      create: data,
    })
    console.log(`  ✅ DataList ${data.slug} создан/проверен`)
  }

  // ============================================
  // 4. PAGE (4 страницы)
  // ============================================
  console.log('\n📄 Таблица Page...')

  const pages = [
    {
      slug: 'connect',
      adminTitle: 'Для психологов',
      metaTitle: 'Как присоединиться к каталогу психологов Давай вместе',
      metaDescription: null,
      metaKeywords: null,
      metaRobots: 'index, follow',
      template: 'landing',
      content: `        <!-- Hero секция -->
        <section class="relative overflow-hidden px-4 py-16 md:py-24 lg:py-32">
            <div class="mx-auto max-w-4xl text-center">
                <h1 class="text-3xl font-bold leading-tight tracking-tight text-neutral-dark md:text-5xl lg:text-6xl">
                    Бесплатно войдите в каталог проверенных психологов и получайте
                    клиентов напрямую, <span class="text-primary">без комиссии</span>
                </h1>
                <p class="mx-auto mt-6 max-w-2xl text-lg text-neutral-dark/70 md:text-xl">
                    Получите свидетельство вашей компетентности, которое убедит ваших
                    клиентов гораздо сильнее, чем дипломы и сертификаты.
                </p>
                <div class="mt-10 flex flex-wrap justify-center gap-4">
                    <button class="rounded-button bg-primary px-8 py-3 font-semibold text-white shadow-glass transition-all hover:bg-[#4646c9]">
                        Хочу в каталог
                    </button>
                    <button class="rounded-button border border-primary/20 bg-white/60 px-8 py-3 font-semibold text-primary backdrop-blur-sm transition-all hover:bg-primary-muted">
                        Узнать об экзамене
                    </button>
                </div>
            </div>

            <!-- Декоративные элементы -->
            <div class="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary-muted blur-3xl"></div>
            <div class="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-accent-muted blur-3xl"></div>
        </section>

        <!-- Особенности платформы -->
        <section class="px-4 py-16 md:py-24">
            <div class="mx-auto max-w-6xl">
                <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    <div class="rounded-card bg-white p-6 shadow-glass">
                        <div class="mb-4 text-3xl">💰</div>
                        <h3 class="mb-2 text-xl font-bold text-primary">Клиенты напрямую</h3>
                        <p class="text-neutral-dark/80">Вы сами устанавливаете цены, вы получаете 100% от оплаты.</p>
                    </div>
                    <div class="rounded-card bg-white p-6 shadow-glass">
                        <div class="mb-4 text-3xl">🛡️</div>
                        <h3 class="mb-2 text-xl font-bold text-primary">Доверие через проверку</h3>
                        <p class="text-neutral-dark/80">Ваш уровень подтверждён практическим экзаменом — это сильный аргумент для клиентов.</p>
                    </div>
                    <div class="rounded-card bg-white p-6 shadow-glass">
                        <div class="mb-4 text-3xl">📈</div>
                        <h3 class="mb-2 text-xl font-bold text-primary">Продвижение через экспертизу</h3>
                        <p class="text-neutral-dark/80">Ваши статьи на сайте приводят к вам заинтересованных читателей.</p>
                    </div>
                    <div class="rounded-card bg-white p-6 shadow-glass">
                        <div class="mb-4 text-3xl">🌱</div>
                        <h3 class="mb-2 text-xl font-bold text-primary">Рост и уверенность</h3>
                        <p class="text-neutral-dark/80">Подготовка и сдача экзамена укрепляют вашу профессиональную самооценку.</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Путь в 3 шага -->
        <section class="bg-background-subtle px-4 py-16 md:py-24">
            <div class="mx-auto max-w-6xl">
                <h2 class="mb-12 text-center text-3xl font-bold text-neutral-dark md:text-4xl">
                    Ваш путь в каталог: 3 шага к доверию и клиентам
                </h2>
                <div class="grid gap-8 md:grid-cols-3">
                    <div class="rounded-card bg-white p-6 text-center shadow-glass">
                        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-muted text-2xl font-bold text-primary">1</div>
                        <h3 class="mb-2 text-xl font-bold">Подтвердите уровень</h3>
                        <p class="text-neutral-dark/80">Пройдите экзамен на соответствие выбранному уровню квалификации. Проверка реальных знаний и практических навыков.</p>
                    </div>
                    <div class="rounded-card bg-white p-6 text-center shadow-glass">
                        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-muted text-2xl font-bold text-primary">2</div>
                        <h3 class="mb-2 text-xl font-bold">Разместите анкету</h3>
                        <p class="text-neutral-dark/80">После успешной сдачи экзамена вы бесплатно размещаете анкету в каталоге. Никакой платы за размещение.</p>
                    </div>
                    <div class="rounded-card bg-white p-6 text-center shadow-glass">
                        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-muted text-2xl font-bold text-primary">3</div>
                        <h3 class="mb-2 text-xl font-bold">Пишите и привлекайте</h3>
                        <p class="text-neutral-dark/80">Раз в месяц вы присылаете одну статью. Мы публикуем и даём ссылку на вашу анкету.</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Статьи вместо комиссии -->
        <section class="px-4 py-16 md:py-24">
            <div class="mx-auto max-w-6xl">
                <div class="rounded-card bg-gradient-to-br from-white to-background-subtle p-8 shadow-glass-strong md:p-12">
                    <h2 class="mb-4 text-3xl font-bold text-neutral-dark md:text-4xl">
                        Одна статья в месяц вместо комиссии с клиентов
                    </h2>
                    <p class="mb-8 text-lg text-neutral-dark/80">
                        Представьте: вы платите агрегатору 30–60% с каждого клиента. За
                        год это десятки тысяч рублей, которые вы просто отдаёте за «доступ
                        к базе». Наша модель — инвестиция в ваш личный бренд.
                    </p>
                    <div class="grid gap-6 md:grid-cols-2">
                        <div class="flex gap-3">
                            <span class="text-2xl">⏰</span>
                            <div>
                                <h4 class="font-bold">Работают на вас 24/7</h4>
                                <p class="text-sm text-neutral-dark/70">Статьи приводят людей из поиска, которые уже интересуются вашей темой.</p>
                            </div>
                        </div>
                        <div class="flex gap-3">
                            <span class="text-2xl">🎨</span>
                            <div>
                                <h4 class="font-bold">Демонстрируют ваш стиль</h4>
                                <p class="text-sm text-neutral-dark/70">Ещё до консультации отсеивая неподходящих и привлекая «ваших» клиентов.</p>
                            </div>
                        </div>
                        <div class="flex gap-3">
                            <span class="text-2xl">🏆</span>
                            <div>
                                <h4 class="font-bold">Закрепляют статус эксперта</h4>
                                <p class="text-sm text-neutral-dark/70">Не только на нашем сайте, но и в интернете в целом.</p>
                            </div>
                        </div>
                        <div class="flex gap-3">
                            <span class="text-2xl">📈</span>
                            <div>
                                <h4 class="font-bold">Эффективнее личного блога</h4>
                                <p class="text-sm text-neutral-dark/70">Работают гораздо эффективней за счёт мощного потока читателей.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Экзамен -->
        <section class="bg-background-subtle px-4 py-16 md:py-24">
            <div class="mx-auto max-w-6xl">
                <div class="grid items-center gap-12 md:grid-cols-2">
                    <div>
                        <h2 class="mb-4 text-3xl font-bold text-neutral-dark md:text-4xl">
                            Экзамен — объективное зеркало ваших навыков
                        </h2>
                        <p class="mb-6 text-lg text-neutral-dark/80">
                            В каталог могут попасть только психологи, на практике доказавшие уровень своей квалификации.
                        </p>
                        <ul class="space-y-3">
                            <li class="flex items-start gap-2"><span class="text-primary">✓</span> Внешнее подтверждение — аргумент для клиентов</li>
                            <li class="flex items-start gap-2"><span class="text-primary">✓</span> Внутренняя уверенность — понимание сильных сторон</li>
                            <li class="flex items-start gap-2"><span class="text-primary">✓</span> Честная диагностика — обратная связь, над чем работать</li>
                        </ul>
                    </div>
                    <div class="space-y-6 rounded-card bg-white p-6 shadow-glass">
                        <div class="border-l-4 border-primary pl-4">
                            <h3 class="text-xl font-bold">Самостоятельная сдача</h3>
                            <p class="text-neutral-dark/70">Если вы уверены в своих силах и готовы подтвердить уровень без дополнительной подготовки.</p>
                        </div>
                        <div class="border-l-4 border-primary pl-4">
                            <h3 class="text-xl font-bold">Курс + экзамен</h3>
                            <p class="text-neutral-dark/70">Пройти курс Школы психологии Сергея Смирнова с последующей обязательной аттестацией.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Взаимный вклад -->
        <section class="px-4 py-16 md:py-24">
            <div class="mx-auto max-w-4xl text-center">
                <h2 class="mb-6 text-3xl font-bold text-neutral-dark md:text-4xl">
                    Взаимный вклад: экспертиза в обмен на продвижение и доверие
                </h2>
                <div class="rounded-card bg-white p-6 shadow-glass md:p-8">
                    <p class="mb-4">
                        <strong>Требования к статьям:</strong> Статья должна быть
                        уникальной, полезной и проходить модерацию. Вы можете присылать
                        больше — это увеличит ваше присутствие на сайте.
                    </p>
                    <p class="mb-0 text-primary">
                        <strong>Если статьи нет:</strong> Анкета временно скрывается.
                        Чтобы вернуться, нужно восполнить недостающие материалы.
                    </p>
                </div>
            </div>
        </section>

        <!-- Для кого подходит -->
        <section class="bg-background-subtle px-4 py-16 md:py-24">
            <div class="mx-auto max-w-6xl">
                <div class="grid gap-8 md:grid-cols-2">
                    <div class="rounded-card bg-white p-6 shadow-glass">
                        <h3 class="mb-4 text-2xl font-bold text-[#8ee64a]">✨ Это для вас, если:</h3>
                        <ul class="space-y-2">
                            <li>✓ Цените прямой контакт с клиентом</li>
                            <li>✓ Готовы подтвердить свою работу делом</li>
                            <li>✓ Видите смысл в экспертной публичности</li>
                        </ul>
                    </div>
                    <div class="rounded-card bg-white p-6 shadow-glass">
                        <h3 class="mb-4 text-2xl font-bold text-neutral-dark/60">⚠️ Не подходит, если:</h3>
                        <ul class="space-y-2">
                            <li>✗ Считаете написание статей пустой тратой времени</li>
                            <li>✗ Не готовы к объективной проверке навыков</li>
                            <li>✗ Ищете способ получать клиентов без усилий</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>

        <!-- Частые вопросы -->
        <section class="px-4 py-16 md:py-24">
            <div class="mx-auto max-w-4xl">
                <h2 class="mb-12 text-center text-3xl font-bold text-neutral-dark md:text-4xl">
                    Частые вопросы психологов
                </h2>
                <div class="space-y-6">
                    <details class="rounded-card bg-white p-6 shadow-glass">
                        <summary class="text-lg font-semibold">А если у меня нет времени или идей для статей каждый месяц?</summary>
                        <p class="mt-3 text-neutral-dark/70">Если вы ведёте практику, у вас точно есть клиентские случаи, инсайты, ответы на частые вопросы клиентов. Это и есть лучшие темы для статей.</p>
                    </details>
                    <details class="rounded-card bg-white p-6 shadow-glass">
                        <summary class="text-lg font-semibold">Чем ваш уровень лучше сертификата с курса?</summary>
                        <p class="mt-3 text-neutral-dark/70">Сертификат говорит: «Я прослушал курс». Наш уровень говорит: «Я доказал, что умею применять эти знания на практике».</p>
                    </details>
                    <details class="rounded-card bg-white p-6 shadow-glass">
                        <summary class="text-lg font-semibold">Что будет, если мою статью не примут?</summary>
                        <p class="mt-3 text-neutral-dark/70">Модератор даст обратную связь, почему. Вы сможете доработать материал или предложить новую тему.</p>
                    </details>
                </div>
            </div>
        </section>

        <!-- Финальный CTA -->
        <section class="px-4 py-16 md:py-24">
            <div class="mx-auto max-w-4xl text-center">
                <div class="rounded-card bg-gradient-to-r from-primary-muted to-accent-muted p-8 shadow-glass-strong md:p-12">
                    <h2 class="mb-4 text-3xl font-bold text-neutral-dark md:text-4xl">
                        Хочешь получать клиентов? Давай вместе!
                    </h2>
                    <p class="mb-8 text-lg text-neutral-dark/80">
                        Докажи свой уровень квалификации делом и присоединяйся к
                        сообществу, где главное — быть хорошим психологом.
                    </p>
                    <button class="rounded-button bg-primary px-8 py-3 font-semibold text-white shadow-glass transition-all hover:bg-[#4646c9]">
                        Подтвердить уровень и разместить анкету
                    </button>
                </div>
            </div>
        </section>`,
      customHead: `    <style>
        /* Дополнительные стили для деталей, которые не покрываются Tailwind */
        details > summary {
            list-style: none;
            cursor: pointer;
        }
        details > summary::-webkit-details-marker {
            display: none;
        }
        details > summary::before {
            content: "▶";
            display: inline-block;
            margin-right: 0.75rem;
            font-size: 0.875rem;
            color: #5858E2;
            transition: transform 0.2s ease;
        }
        details[open] > summary::before {
            transform: rotate(90deg);
        }
    </style>`,
      images: [],
      isPublished: true,
    },
    {
      slug: 'cookies',
      adminTitle: 'Политика cookie-файлов',
      metaTitle: 'Политика использования cookie-файлов',
      metaDescription: null,
      metaKeywords: null,
      metaRobots: 'index, follow',
      template: 'text',
      content: `<p><strong>ИП Смирнов Сергей Александрович</strong> (далее – «Компания»)<br>Сайт: <strong><a href="https://dvmeste.ru">https://dvmeste.ru</a></strong> (далее – «веб-сайт»)</p>
<p>Настоящая Политика использования cookie-файлов (далее – «Политика») применяется в дополнение к Политике обработки персональных данных ИП Смирнов Сергей Александрович, которая распространяется на продукты и сервисы Компании (далее – «Сервисы»). Политика описывает типы cookie-файлов, цели их использования, порядок обработки данных, собранных при посещении веб-сайта <a href="https://dvmeste.ru/">https://dvmeste.ru/</a>, а также способы отказа от обработки cookie.</p>
<p>При первом посещении сайта отображается баннер, информирующий об использовании cookie-файлов и запрашивающий Ваше согласие на их обработку.</p>
<p>Нажимая кнопку <strong>«Принять»</strong> или продолжая пользоваться веб-сайтом, Вы даете согласие на обработку Ваших cookie-файлов. Вы можете отказаться от обработки cookie-файлов, однако это может привести к некорректной работе некоторых функций сайта.</p>
<p>Актуальная версия Политики размещена по адресу: <strong><a href="https://dvmeste.ru/cookies">https://dvmeste.ru/cookies</a></strong></p>
<hr>
<h2>1. Что такое cookie-файлы?</h2>
<p>Cookie-файлы – это небольшие фрагменты данных, которые веб-сайт запрашивает у браузера, установленного на Вашем компьютере или мобильном устройстве. Cookie-файлы отражают Ваши предпочтения и действия на сайте, а также информацию об оборудовании, дате и времени сессии. Они хранятся локально на Вашем устройстве. При желании Вы можете удалить сохраненные cookie-файлы через настройки браузера.</p>
<h2>2. Как мы используем cookie-файлы?</h2>
<p>Компания использует cookie-файлы для улучшения работы веб-сайта, совершенствования сервисов, определения предпочтений пользователей, повышения персонализации и интерактивности, а также для показа целевой информации о продуктах и услугах.</p>
<p>Cookie-файлы помогают нам:</p>
<ul>
<li>обеспечивать работу авторизованных пользователей в Сервисах;</li>
<li>улучшать качество взаимодействия с Сервисами;</li>
<li>показывать приоритетную для Вас информацию;</li>
<li>сохранять пользовательские настройки и предпочтения;</li>
<li>отображать рекламу и информацию, которая может Вас заинтересовать;</li>
<li>анализировать статистику использования Сервисов.</li>
</ul>
<p>На основе данных, полученных с помощью cookie-файлов, Компания разрабатывает полезный функционал, создает новые Сервисы, проводит статистические и маркетинговые исследования, исправляет ошибки и тестирует новые функции.</p>
<h2>3. Как мы обрабатываем cookie-файлы?</h2>
<p>Веб-сайт обрабатывает полученные данные, в том числе с использованием метрических программ, таких как <strong>Яндекс.Метрика</strong>, <strong>Пиксель VK Рекламы</strong> и иных отечественных аналитических систем.</p>
<p>Третьи лица (включая Ваш браузер) имеют собственные политики использования cookie-файлов.</p>
<h2>4. Какие виды cookie-файлов мы используем?</h2>
<h3>Сессионные</h3>
<p>Существуют во временной памяти, пока Вы находитесь на странице сайта. Браузер удаляет их после закрытия окна. Позволяют сайту запоминать информацию о Вашем выборе, чтобы избежать повторного ввода данных.</p>
<h3>Постоянные</h3>
<p>Хранятся на Вашем компьютере и не удаляются при закрытии браузера. Сохраняют пользовательские настройки для использования в будущих сеансах. Позволяют идентифицировать Вас как уникального пользователя при возвращении на сайт.</p>
<h3>Статистические, аналитические / маркетинговые</h3>
<p>Включают информацию о том, как Вы используете сайт: какие страницы посещаете, по каким ссылкам переходите. Цель — улучшение функционала и пользовательского опыта, определение предпочтений и показ релевантной информации.</p>
<h3>Обязательные</h3>
<p>Минимальный набор cookie-файлов, необходимый для корректной работы веб-сайта.</p>
<p>Компания также может применять <strong>веб-маяки (пиксельные теги)</strong> для доступа к cookie-файлам, ранее размещенным на Вашем устройстве, с целью анализа действий при работе с Сервисами.</p>
<p>Используются <strong>Y-cookie</strong> – контейнеры, содержащие множественные значения (например, <code>ys</code>). Они уменьшают количество обрабатываемых браузером cookie-файлов и ускоряют загрузку страниц.</p>
<p><strong>Яндекс.Метрика</strong> собирает обезличенную информацию об источниках трафика, посещаемости и эффективности рекламы с помощью анонимных идентификаторов браузеров, сохраняемых в cookie-файлах.</p>
<p>Отключение некоторых типов cookie-файлов может сделать невозможным использование отдельных разделов или функций Сервисов (например, доступ к разделам, требующим авторизации).</p>
<h2>5. Управление cookie-файлами</h2>
<p>Cookie-файлы устанавливаются в браузер на Вашем устройстве автоматически. Вы можете отказаться от их обработки в настройках браузера (см. раздел «Справка» Вашего браузера). В этом случае сайт будет использовать только строго необходимые для функционирования cookie-файлы.</p>
<p>Компания не требует обязательного согласия на установку всех типов cookie-файлов. Если Вы не хотите, чтобы cookie-файлы сохранялись, отключите эту опцию в настройках браузера. Сохраненные файлы можно удалить в любое время.</p>
<p>Если Вы одобрили использование cookie-файлов на одном из Сервисов Компании, это означает согласие на использование cookie-файлов на всех Сервисах Компании.</p>
<h2>6. Срок хранения cookie-файлов на Вашем устройстве</h2>
<p>Компания использует <strong>сессионные</strong> cookie-файлы (например, <code>cookie_check</code> для запоминания данных авторизации). Их срок действия истекает в конце сессии (при закрытии браузера).</p>
<p>Также используются <strong>постоянные</strong> cookie-файлы для запоминания предпочтений (язык, местоположение и др.). Они автоматически удаляются после выполнения своей задачи.</p>
<p>Сроки обработки информации из cookie-файлов определяются настоящей Политикой и Политикой обработки персональных данных Компании.</p>
<h2>7. Кто, кроме Компании, имеет доступ к информации из cookie-файлов?</h2>
<p>Партнеры Компании могут собирать информацию о пользователях с помощью cookie-файлов или пиксельных тегов в рамках использования Сервисов. Это позволяет анализировать активность, подсчитывать посещения и показывать адаптированную рекламу.</p>
<p>Данные передаются следующим партнерам:</p>
<ul>
<li><strong>ООО «Яндекс»</strong></li>
<li><strong>ООО «ВК»</strong></li>
</ul>
<p>Информация, собранная с помощью cookie-файлов, может быть передана Компании и/или партнерам на условиях Политики обработки персональных данных Компании. Использование данных вне Сервисов регулируется правилами партнеров. Компания и/или партнеры могут предоставить возможность отказа от персонализации рекламы в соответствии с законодательством.</p>
<h2>8. Как с нами связаться?</h2>
<p>По вопросам обработки персональных данных или реализации прав субъекта персональных данных обращайтесь по электронной почте: <strong><a href="mailto:info@dvmeste.ru">info@dvmeste.ru</a></strong></p>
<p>В письме укажите:</p>
<ul>
<li>Паспортные данные (серия, номер, дата выдачи, кем выдан);</li>
<li>Учетные данные (телефон или электронную почту, указанную при регистрации).</li>
</ul>
<p>Срок ответа на запрос — не более 10 рабочих дней с момента получения. При необходимости продления срока Вам будет направлено уведомление с указанием причин.</p>
<h2>9. Иные положения</h2>
<p>Компания может периодически вносить изменения и/или дополнения в Политику без предварительного уведомления пользователей. Продолжение использования сайта означает Ваше согласие с обновленной Политикой. При несогласии с любым положением Вы обязаны прекратить использование сайта.</p>
<p>Новая редакция Политики вступает в силу с момента ее публикации на сайте. Пользователь считается согласившимся с новой версией с момента ее акцепта (в том числе путем дальнейшего использования сайта после размещения новой версии).</p>
<p>В части, не урегулированной настоящей Политикой, применяются положения <strong>Политики обработки персональных данных ИП Смирнов Сергей Александрович</strong>.</p>
<hr>
<p><strong>ИП Смирнов Сергей Александрович</strong><br><strong>Сайт:</strong> <a href="https://dvmeste.ru">https://dvmeste.ru</a></p>`,
      customHead: null,
      images: [],
      isPublished: true,
    },
    {
      slug: 'home',
      adminTitle: 'Главная',
      metaTitle: 'Давай вместе подберем психолога в каталоге психологов',
      metaDescription: '222',
      metaKeywords: '222',
      metaRobots: 'index, follow',
      template: 'landing',
      content: `<div class="not-tailwind">
   <!-- Главный экран с фоновым изображением -->
    <section class="hero">
        <div class="hero-background">
            <img src="/files/pages/page-cmmdylcgn0004rgugt3jlaq68/2chairs.png" alt="Два кресла для психотерапии">
        </div>
        <div class="container">
            <div class="hero-content">
                <h1>Выбирайте психолога с подтверждённой квалификацией, а не просто красивой анкетой. <span class="blue">Без комиссий и наценок.</span></h1>
                <p>Как выбрать действительно квалифицированного психолога и не потерять деньги и время с некомпетентным специалистом?</p>
                <p>«Давай вместе» — каталог, где каждый психолог подтвердил свои навыки на практике, а не на бумаге. Выбирайте по уровню квалификации, связывайтесь и платите напрямую психологу без комиссий.</p>
                <div class="hero-buttons">
                    <a href="#catalog" class="btn">Найти психолога</a>
                    <a href="2psycholoists.html" class="btn btn-outline">Я психолог, хочу в каталог</a>
                </div>
            </div>
        </div>
    </section>

    <!-- Как это работает -->
    <section class="steps" id="how-it-works">
        <div class="container">
            <h2>Подберите проверенного психолога за 3 шага</h2>
            <div class="steps-grid">
                <div class="step-item">
                    <div class="step-icon">
                        <i class="fas fa-search"></i>
                    </div>
                    <h3>Выберите по уровню</h3>
                    <p>Психологи в каталоге подтвердили свой уровень квалификации, сдав соответствующий экзамен. Ищите по этому уровню, специализации, цене или формату.</p>
                </div>
                
                <div class="step-item">
                    <div class="step-icon">
                        <i class="fas fa-comments"></i>
                    </div>
                    <h3>Свяжитесь напрямую</h3>
                    <p>Посмотрите контакты: телеграм, почта, телефон. Договаривайтесь о времени и условиях работы напрямую со специалистом.</p>
                    <p>Мы не берем комиссию, поэтому ваш договор с психологом прямой.</p>
                </div>
                
                <div class="step-item">
                    <div class="step-icon">
                        <i class="fas fa-handshake"></i>
                    </div>
                    <h3>Начните работу</h3>
                    <p>Оплачивайте сессии психологу по его тарифу. Мы не берём комиссию и не участвуем в ваших расчётах. Только вы и специалист.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Наше отличие -->
    <section class="difference" id="difference">
        <div class="container">
            <div class="difference-content">
                <div>
                    <h2>Уровень, подтверждённый на практике. Не на словах.</h2>
                    <p>В терапии важнее всего — компетенции, а не дипломы.</p>
                    <p>Вы приходите решать конкретную проблему, а не оценивать теорию. Поэтому мы создали систему, где психологи доказывают именно практические навыки.</p>
                    <p>Мы оцениваем умения и навыки реальной работы. Проверка документов - вторична.</p>
                    <p>Каждый психолог в каталоге сам выбрал уровень — и подтвердил его, сдав сложный практический экзамен.</p>
                    <p>Это может быть разбор реальных случаев, анализ сессий или очное испытание с экспертами. Мы смотрим не на формальности, а на качество работы.</p>
                    <p>Наша задача — дать вам понять, на что действительно способен специалист, прежде чем вы к нему обратитесь.</p>
                </div>
                
                <div>
                    <div class="difference-points">
                        <div class="point">
                            <div class="point-icon">
                                <i class="fas fa-clipboard-check"></i>
                            </div>
                            <h4>Проверка на реальных задачах</h4>
                            <p>Подтверждение уровня через анализ навыков, а не документов.</p>
                        </div>
                        
                        <div class="point">
                            <div class="point-icon">
                                <i class="fas fa-user-check"></i>
                            </div>
                            <h4>Прямой контакт</h4>
                            <p>Вы общаетесь и рассчитываетесь напрямую, без посредников.</p>
                        </div>
                        
                        <div class="point">
                            <div class="point-icon">
                                <i class="fas fa-shield-alt"></i>
                            </div>
                            <h4>Ответственность</h4>
                            <p>На каждого специалиста можно подать жалобу. Мы разберёмся и примем меры.</p>
                        </div>
                        
                        <div class="point">
                            <div class="point-icon">
                                <i class="fas fa-chart-line"></i>
                            </div>
                            <h4>Профессиональный рост</h4>
                            <p>Психологи могут подтвердить новый уровень, пройдя экзамен заново.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Система уровней и доверия -->
    <section class="trust-system" id="trust">
        <div class="container">
            <h2>Как мы создаём пространство доверия</h2>
            <div class="trust-grid">
                <div class="trust-block">
                    <h3>Ваш выбор защищён дважды</h3>
                    <p><strong>До начала работы:</strong> Вы видите не просто регалии, а реальный уровень навыков, подтверждённый сложным экзаменом.</p>
                    <p><strong>В процессе работы:</strong> Вы получаете гарантию этичного пространства. Если что-то пойдёт не так — мы на вашей стороне. Разберёмся и, если нужно, исключим специалиста.</p>
                    <a href="#" class="trust-link">Подробнее о защите клиентов →</a>
                </div>
                
                <div class="trust-block">
                    <h3>ЗАМЕНИТЬ <br>Вы подтверждаете свой профессионализм</h3>
                    <ul>
                        <li>Выбираете уровень, экзамен на который хотите сдать.</li>
                        <li>Проходите практическое испытание, доказывая свой реальный навык работы.</li>
                        <li>Получаете объективную оценку и место в каталоге среди коллег своего уровня.</li>
                    </ul>
                    <p>При желании можете пройти экзамен заново или на другой уровень.</p>
                    <a href="#" class="trust-link">Подробнее о системе уровней и экзаменах →</a>
                </div>
            </div>
        </div>
    </section>

    <!-- Для кого это? -->
    <section class="for-whom" id="for-whom">
        <div class="container">
            <h2>«Давай вместе» — для тех, кто ценит осознанность и безопасность</h2>
            <div class="for-whom-grid">
                <div class="audience-block clients">
                    <h3>Вам важно не ошибиться в выборе</h3>
                    <p>Вы хотите видеть не только отзывы, но и объективное подтверждение квалификации. Вы цените прозрачность, прямые контакты и честные цены без комиссий. И хотите знать, что в случае проблемы вас услышат.</p>
                </div>
                
                <div class="audience-block psychologists">
                    <h3>ЗАМЕНИТЬ<br>Вы хотите профессионально расти и работать честно</h3>
                    <p>Вы готовы подтвердить свою работу на практике, а не только формально. И получать клиентов без привязки к агрегаторам с их комиссиями и странными правилами.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Частые вопросы -->
    <section class="faq" id="faq">
        <div class="container">
            <h2>Честные ответы на главные вопросы</h2>
            <div class="faq-container">
                <div class="faq-item">
                    <div class="faq-question">
                        Как именно вы проверяете психологов?
                    </div>
                    <div class="faq-answer">
                        <p>Мы проводим практические экзамены. Психолог сам выбирает уровень, на который претендует, и сдаёт соответствующий экзамен. Экзамены могут быть организованы по-разному: очная демонстрация работы, предоставление записей или расшифровок реальных работ, а также прохождение тестов и собеседование. Мы также проверяем документы и образование, но это - вторичные критерии качества. Мы оцениваем реальные навыки, а не формальные признаки.</p>
                    </div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">
                        Что, если у меня будет конфликт с психологом или мне не понравится его работа?
                    </div>
                    <div class="faq-answer">
                        <p>На каждого специалиста в каталоге можно подать обоснованную жалобу через специальную форму. Мы объективно разберём ситуацию, запросим объяснения у обеих сторон и, если нарушения подтвердятся, примем меры — вплоть до удаления психолога из каталога.</p>
                    </div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">
                        В чём ваша выгода, если вы не берёте комиссию?
                    </div>
                    <div class="faq-answer">
                        <p>Наша цель — создать самое качественное и безопасное сообщество психологов и клиентов в рунете. Мы верим, что такая система, построенная на доверии и профессионализме, будет востребована. В будущем возможны премиум-услуги для психологов (например, продвижение профиля), но комиссия с консультаций клиентов исключена навсегда.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Заключительный призыв -->
    <section class="cta" id="catalog">
        <div class="container">
            <h2>Начните терапию с выбора психолога, который доказал свой уровень делом</h2>
            <p>Начните с понимания реальных навыков специалиста. Это снижает риски и экономит ваше время, деньги и душевные силы.</p>
            <a href="#" class="btn">Перейти в каталог психологов</a>
        </div>
    </section>
</div>`,
      customHead: `<link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>

.not-tailwind {
  all: initial;
}

.not-tailwind * {
  all: unset;
}

/* Затем вернуть нужные display свойства */
.not-tailwind div,
.not-tailwind section,
.not-tailwind article {
  display: block;
}
.page-home *{margin:0;padding:0;box-sizing:border-box}
.page-home :root{--primary-color: #5858E2;--accent-color: #A7FF5A;--dark-color: #1A1A2E;--text-color: #333333;--light-gray: #F5F7FA;--border-radius: 12px;--transition: all 0.3s ease}
.page-home body{font-family:"Montserrat",sans-serif;line-height:1.6;color:var(--text-color);background-color:#fff}
.page-home .container{width:100%;max-width:1200px;margin:0 auto;padding:0 20px}
.page-home section{padding:80px 0}
.page-home h1,.page-home h2,.page-home h3{font-weight:700;line-height:1.2;color:var(--dark-color)}
.page-home h1{font-size:2.8rem;margin-bottom:1.5rem}
.page-home h2{font-size:2.2rem;margin-bottom:2.5rem;text-align:center}
.page-home h3{font-size:1.5rem;margin-bottom:1rem}
.page-home p{margin-bottom:1.5rem;font-size:1.1rem}
.page-home a{text-decoration:none;color:inherit;transition:var(--transition)}
.page-home .btn{display:inline-block;padding:16px 32px;background-color:var(--primary-color);color:white;border-radius:var(--border-radius);font-weight:600;font-size:1.1rem;border:none;cursor:pointer;transition:var(--transition);text-align:center}
.page-home .btn:hover{background-color:#4242c9;transform:translateY(-2px);box-shadow:0 5px 15px rgba(88,88,226,0.2)}
.page-home .btn-accent{background-color:var(--accent-color);color:var(--dark-color)}
.page-home .btn-accent:hover{background-color:#95e64d}
.page-home .btn-outline{background-color:transparent;border:2px solid var(--primary-color);color:var(--primary-color)}
.page-home .btn-outline:hover{background-color:rgba(88,88,226,0.05)}
.page-home header{padding:20px 0;position:fixed;width:100%;background-color:rgba(255,255,255,0.98);box-shadow:0 2px 10px rgba(0,0,0,0.05);z-index:1000}
.page-home .header-content{display:flex;justify-content:space-between;align-items:center}
.page-home .logo{font-size:1.8rem;font-weight:700;color:var(--primary-color)}
.page-home .logo span{color:var(--accent-color)}
.page-home .nav-links{display:flex;gap:30px}
.page-home .nav-links a{font-weight:500}
.page-home .nav-links a:hover{color:var(--primary-color)}
.page-home .mobile-menu-btn{display:none;background:none;border:none;font-size:1.5rem;color:var(--dark-color);cursor:pointer}
.page-home .hero{padding-top:160px;padding-bottom:100px;position:relative;background-color:var(--light-gray);border-radius:0 0 40px 40px;overflow:hidden}
.page-home .hero-background{position:absolute;top:0;right:0;width:100%;height:100%;z-index:0}
.page-home .hero-background img{width:100%;height:100%;object-fit:cover;object-position:right center}
.page-home .hero-background::after{content:"";position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(90deg,rgba(245,247,250,0.95) 0%,rgba(245,247,250,0.65) 50%,rgba(245,247,250,0.1) 100%)}
.page-home .hero .container{position:relative;z-index:1}
.page-home .hero-content{max-width:800px;position:relative;z-index:2}
.page-home .hero h1 span.blue{color:var(--primary-color)}
.page-home .hero h1 span.green{color:var(--accent-color)}
.page-home .hero-buttons{display:flex;gap:20px;margin-top:30px;flex-wrap:wrap}
.page-home .steps{background-color:white}
.page-home .steps-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:40px;margin-top:50px}
.page-home .step-item{text-align:center;padding:30px;border-radius:var(--border-radius);transition:var(--transition)}
.page-home .step-item p{text-align:left}
.page-home .step-item:hover{transform:translateY(-10px);box-shadow:0 15px 30px rgba(0,0,0,0.08)}
.page-home .step-icon{width:80px;height:80px;background-color:rgba(88,88,226,0.1);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 25px;font-size:2rem;color:var(--primary-color)}
.page-home .difference{background-color:var(--light-gray)}
.page-home .difference-content{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}
.page-home .difference-points{display:grid;grid-template-columns:repeat(2,1fr);gap:30px;margin-top:40px}
.page-home .point{padding:20px;background-color:white;border-radius:var(--border-radius);box-shadow:0 5px 15px rgba(0,0,0,0.05)}
.page-home .point-icon{font-size:1.8rem;color:var(--primary-color);margin-bottom:15px}
.page-home .trust-system{background-color:white}
.page-home .trust-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:50px;margin-top:40px}
.page-home .trust-block{padding:40px;border-radius:var(--border-radius);background-color:var(--light-gray);height:100%}
.page-home .trust-block h3{color:var(--primary-color)}
.page-home .trust-block ul{list-style-position:inside;margin-top:20px}
.page-home .trust-block li{margin-bottom:10px}
.page-home .trust-link{display:inline-block;margin-top:20px;color:var(--primary-color);font-weight:600}
.page-home .trust-link:hover{text-decoration:underline}
.page-home .for-whom{background-color:var(--light-gray)}
.page-home .for-whom-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:40px;margin-top:40px}
.page-home .audience-block{padding:40px;background-color:white;border-radius:var(--border-radius);box-shadow:0 5px 20px rgba(0,0,0,0.05)}
.page-home .audience-block.clients{border-top:5px solid var(--primary-color)}
.page-home .audience-block.psychologists{border-top:5px solid var(--accent-color)}
.page-home .faq{background-color:white}
.page-home .faq-container{max-width:800px;margin:0 auto}
.page-home .faq-item{margin-bottom:20px;border-radius:var(--border-radius);overflow:hidden;box-shadow:0 3px 10px rgba(0,0,0,0.05)}
.page-home .faq-question{padding:20px;background-color:var(--light-gray);font-weight:600;cursor:pointer;display:flex;justify-content:space-between;align-items:center}
.page-home .faq-question::after{content:"\\f105";font-family:"Font Awesome 6 Free";font-weight:900;transition:var(--transition)}
.page-home .faq-question.active::after{transform:rotate(90deg)}
.page-home .faq-answer{padding:0 20px;max-height:0;overflow:hidden;transition:var(--transition)}
.page-home .faq-answer.open{padding:20px;max-height:500px}
.page-home .cta{text-align:center;padding:100px 0;background:linear-gradient(135deg,rgba(88,88,226,0.05) 0%,rgba(167,255,90,0.05) 100%)}
.page-home .cta h2{max-width:700px;margin:0 auto 30px}
.page-home footer{background-color:var(--dark-color);color:white;padding:60px 0 30px}
.page-home .footer-content{display:grid;grid-template-columns:repeat(4,1fr);gap:40px;margin-bottom:40px}
.page-home .footer-col h4{margin-bottom:20px;font-size:1.2rem}
.page-home .footer-links a{display:block;margin-bottom:10px;color:#aaa}
.page-home .footer-links a:hover{color:white}
.page-home .copyright{text-align:center;padding-top:30px;border-top:1px solid #333;color:#aaa;font-size:0.9rem}
@media (max-width:992px){.page-home h1{font-size:2.2rem}
.page-home h2{font-size:1.8rem}
.page-home .steps-grid,.page-home .difference-content,.page-home .trust-grid,.page-home .for-whom-grid{grid-template-columns:1fr}
.page-home .footer-content{grid-template-columns:repeat(2,1fr)}
.page-home .difference-points{grid-template-columns:1fr}
}
@media (max-width:768px){.page-home section{padding:60px 0}
.page-home .nav-links{display:none;position:absolute;top:100%;left:0;width:100%;background-color:white;flex-direction:column;padding:20px;box-shadow:0 5px 10px rgba(0,0,0,0.1)}
.page-home .nav-links.active{display:flex}
.page-home .mobile-menu-btn{display:block}
.page-home .hero-buttons{flex-direction:column}
.page-home .hero-buttons .btn{width:100%;text-align:center}
.page-home .footer-content{grid-template-columns:1fr}
.page-home .hero-background img{object-position:70%center}
.page-home .hero-background::after{background:linear-gradient(90deg,rgba(245,247,250,0.98) 0%,rgba(245,247,250,0.95) 70%,rgba(245,247,250,0.9) 100%)}
}
@media (max-width:576px){.page-home h1{font-size:1.8rem}
.page-home h2{font-size:1.5rem}
.page-home .step-item,.page-home .trust-block,.page-home .audience-block{padding:25px}
.page-home .hero-background{opacity:0.4}
.page-home .hero-background::after{background:linear-gradient(90deg,rgba(245,247,250,0.95) 0%,rgba(245,247,250,0.9) 100%)}
}</style>
    <script>
        // FAQ аккордеон
        document.querySelectorAll('.faq-question').forEach(question => {
            question.addEventListener('click', () => {
                const answer = question.nextElementSibling;
                const isOpen = answer.classList.contains('open');
                
                // Закрываем все ответы
                document.querySelectorAll('.faq-answer').forEach(ans => {
                    ans.classList.remove('open');
                });
                
                // Убираем активный класс у всех вопросов
                document.querySelectorAll('.faq-question').forEach(q => {
                    q.classList.remove('active');
                });
                
                // Открываем текущий, если был закрыт
                if (!isOpen) {
                    answer.classList.add('open');
                    question.classList.add('active');
                }
            });
        });
    </script>`,
      images: [],
      isPublished: true,
    },
    {
      slug: 'test',
      adminTitle: 'Тест',
      metaTitle: 'Тест',
      metaDescription: null,
      metaKeywords: null,
      metaRobots: 'index, follow',
      template: 'blank',
      content: `
  <!-- ============================================================
       HERO
  ============================================================ -->
  <section class="hero-mesh relative min-h-screen flex items-center overflow-hidden">

    <!-- Decorative blobs -->
    <div class="blob absolute -top-24 -right-24 w-96 h-96 bg-primary/10 opacity-60 pointer-events-none"></div>
    <div class="blob absolute bottom-0 -left-32 w-72 h-72 bg-accent/20 opacity-50 pointer-events-none" style="animation-delay: -3s;"></div>

    <!-- Floating dots grid (decorative) -->
    <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
      <svg class="absolute right-0 top-16 opacity-[0.06]" width="320" height="320" viewBox="0 0 320 320">
        <defs>
          <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="#5858E2"/>
          </pattern>
        </defs>
        <rect width="320" height="320" fill="url(#dots)"/>
      </svg>
    </div>

    <div class="relative z-10 max-w-5xl mx-auto px-6 py-24 lg:py-32">

      <!-- Badge -->
      <div class="reveal inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-neutral-light rounded-full px-4 py-1.5 text-sm font-medium text-gray-600 mb-8 shadow-glass">
        <span class="w-2 h-2 rounded-full bg-accent animate-pulse-slow inline-block"></span>
        Бесплатно · Без комиссии · Навсегда
      </div>

      <!-- Headline -->
      <h1 class="reveal reveal-delay-1 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight text-gray-900 mb-6 max-w-3xl">
        Войдите в каталог<br/>
        <span class="relative">
          <span class="relative z-10 text-primary">проверенных</span>
          <span class="absolute bottom-1 left-0 w-full h-3 bg-accent/40 -z-0 rounded-sm"></span>
        </span>
        &nbsp;психологов
      </h1>

      <!-- Sub -->
      <p class="reveal reveal-delay-2 text-lg sm:text-xl text-gray-600 max-w-2xl mb-4 leading-relaxed">
        Получайте клиентов напрямую, без комиссии. Докажите компетентность практическим экзаменом — это убеждает сильнее любых дипломов.
      </p>
      <p class="reveal reveal-delay-2 text-base text-neutral-dark max-w-xl mb-10 leading-relaxed">
        «Давай вместе» — не агрегатор. Никаких нереальных требований, никакой платы за размещение, никакой комиссии. Просто будьте хорошим психологом и докажите это делом.
      </p>

      <!-- CTA -->
      <div class="reveal reveal-delay-3 flex flex-wrap gap-3 mb-16">
        <a href="#catalog" class="btn-primary rounded-button px-7 py-3.5 font-semibold text-base inline-flex items-center gap-2">
          Хочу в каталог
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
          </svg>
        </a>
        <a href="#exam" class="rounded-button px-7 py-3.5 font-semibold text-base border-2 border-primary/25 text-primary bg-primary/5 hover:bg-primary/10 transition-colors inline-flex items-center gap-2">
          Узнать об экзамене
        </a>
      </div>

      <!-- Feature pills -->
      <div class="reveal reveal-delay-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="card-hover bg-white/70 backdrop-blur-sm border border-neutral-light rounded-card p-4 shadow-glass text-center">
          <div class="text-2xl mb-1">💸</div>
          <div class="text-xs font-semibold text-gray-700">Клиенты напрямую</div>
          <div class="text-xs text-neutral-dark mt-0.5">100% оплаты — вам</div>
        </div>
        <div class="card-hover bg-white/70 backdrop-blur-sm border border-neutral-light rounded-card p-4 shadow-glass text-center">
          <div class="text-2xl mb-1">🏅</div>
          <div class="text-xs font-semibold text-gray-700">Доверие через проверку</div>
          <div class="text-xs text-neutral-dark mt-0.5">Практический экзамен</div>
        </div>
        <div class="card-hover bg-white/70 backdrop-blur-sm border border-neutral-light rounded-card p-4 shadow-glass text-center">
          <div class="text-2xl mb-1">✍️</div>
          <div class="text-xs font-semibold text-gray-700">Продвижение</div>
          <div class="text-xs text-neutral-dark mt-0.5">Через экспертизу</div>
        </div>
        <div class="card-hover bg-white/70 backdrop-blur-sm border border-neutral-light rounded-card p-4 shadow-glass text-center">
          <div class="text-2xl mb-1">🚀</div>
          <div class="text-xs font-semibold text-gray-700">Рост и уверенность</div>
          <div class="text-xs text-neutral-dark mt-0.5">Сильная самооценка</div>
        </div>
      </div>
    </div>
  </section>

  <!-- ============================================================
       TICKER / SOCIAL PROOF
  ============================================================ -->
  <div class="bg-primary py-3 overflow-hidden select-none" aria-hidden="true">
    <div class="marquee-track inline-flex gap-12 text-white/80 text-sm font-medium">
      <span>🔒 Независимая экспертиза</span>
      <span>·</span>
      <span>💯 0% комиссии за клиентов</span>
      <span>·</span>
      <span>📝 Одна статья в месяц</span>
      <span>·</span>
      <span>🎯 Прямой контакт с клиентом</span>
      <span>·</span>
      <span>🏆 Практический экзамен</span>
      <span>·</span>
      <span>🔍 Яндекс и Google трафик</span>
      <span>·</span>
      <span>🔒 Независимая экспертиза</span>
      <span>·</span>
      <span>💯 0% комиссии за клиентов</span>
      <span>·</span>
      <span>📝 Одна статья в месяц</span>
      <span>·</span>
      <span>🎯 Прямой контакт с клиентом</span>
      <span>·</span>
      <span>🏆 Практический экзамен</span>
      <span>·</span>
      <span>🔍 Яндекс и Google трафик</span>
      <span>·</span>
    </div>
  </div>

  <!-- ============================================================
       STEPS — 3 шага
  ============================================================ -->
  <section id="catalog" class="bg-background-subtle py-24 px-6">
    <div class="max-w-4xl mx-auto">

      <div class="reveal text-center mb-16">
        <span class="text-xs font-bold uppercase tracking-widest text-primary/70 mb-3 block">Ваш путь</span>
        <h2 class="text-3xl sm:text-4xl font-extrabold text-gray-900">
          3 шага к доверию и клиентам
        </h2>
      </div>

      <div class="relative space-y-0">

        <!-- Step 1 -->
        <div class="reveal relative flex gap-6 pb-12 step-line">
          <div class="flex-shrink-0">
            <div class="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center font-extrabold text-xl shadow-glass-strong z-10 relative">
              1
            </div>
          </div>
          <div class="card-hover bg-white rounded-card p-6 flex-1 shadow-glass border border-neutral-light/60">
            <h3 class="font-bold text-xl text-gray-900 mb-2">Подтвердите уровень</h3>
            <p class="text-gray-600 leading-relaxed">
              Пройдите экзамен на соответствие выбранному уровню квалификации. Это проверка реальных знаний и практических навыков — не формальность.
            </p>
            <div class="mt-4 flex items-center gap-2 text-sm text-primary font-medium">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Практический экзамен
            </div>
          </div>
        </div>

        <!-- Step 2 -->
        <div class="reveal reveal-delay-1 relative flex gap-6 pb-12 step-line">
          <div class="flex-shrink-0">
            <div class="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center font-extrabold text-xl shadow-glass-strong z-10 relative">
              2
            </div>
          </div>
          <div class="card-hover bg-white rounded-card p-6 flex-1 shadow-glass border border-neutral-light/60">
            <h3 class="font-bold text-xl text-gray-900 mb-2">Разместите анкету</h3>
            <p class="text-gray-600 leading-relaxed">
              После успешной сдачи экзамена вы бесплатно размещаете анкету в каталоге. Никакой платы за размещение. Совсем никакой.
            </p>
            <div class="mt-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-accent-hover bg-accent/20 px-3 py-1 rounded-full border border-accent/30">
              ✓ Бесплатно навсегда
            </div>
          </div>
        </div>

        <!-- Step 3 -->
        <div class="reveal reveal-delay-2 relative flex gap-6">
          <div class="flex-shrink-0">
            <div class="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center font-extrabold text-xl shadow-glass-strong z-10 relative">
              3
            </div>
          </div>
          <div class="card-hover bg-white rounded-card p-6 flex-1 shadow-glass border border-neutral-light/60">
            <h3 class="font-bold text-xl text-gray-900 mb-2">Пишите и привлекайте</h3>
            <p class="text-gray-600 leading-relaxed">
              Раз в месяц вы присылаете одну статью. Мы публикуем и даём ссылку на вашу анкету. Ваши тексты работают на вас 24/7.
            </p>
            <div class="mt-4 flex items-center gap-2 text-sm text-gray-500">
              <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
              </svg>
              1 статья = доступ к каталогу
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>

  <!-- ============================================================
       СТАТЬИ vs КОМИССИЯ — сравнение
  ============================================================ -->
  <section class="bg-background py-24 px-6">
    <div class="max-w-5xl mx-auto">

      <div class="reveal text-center mb-16">
        <span class="text-xs font-bold uppercase tracking-widest text-primary/70 mb-3 block">Наша модель</span>
        <h2 class="text-3xl sm:text-4xl font-extrabold text-gray-900 max-w-2xl mx-auto leading-tight">
          Одна статья в месяц<br/>
          <span class="text-primary">вместо комиссии с клиентов</span>
        </h2>
      </div>

      <!-- Comparison cards -->
      <div class="reveal grid md:grid-cols-2 gap-6 mb-14">

        <!-- Агрегатор (bad) -->
        <div class="rounded-card p-8 bg-red-50 border-2 border-red-100 relative overflow-hidden">
          <div class="absolute top-4 right-4 text-xs font-bold text-red-400 uppercase tracking-wider">Агрегатор</div>
          <div class="text-4xl mb-4">😓</div>
          <h3 class="font-bold text-xl text-gray-900 mb-3">30–60% с каждого клиента</h3>
          <p class="text-gray-600 text-sm leading-relaxed mb-4">
            За год это десятки тысяч рублей, которые вы просто отдаёте за «доступ к базе». Деньги уходят — навыки и репутация не растут.
          </p>
          <!-- Progress bar -->
          <div class="space-y-2">
            <div class="flex justify-between text-xs text-gray-500 font-medium">
              <span>Ваш доход</span><span>~50%</span>
            </div>
            <div class="h-2.5 rounded-full bg-red-100 overflow-hidden">
              <div class="h-full bg-red-300 rounded-full grow-bar" style="width: 50%;"></div>
            </div>
            <div class="flex justify-between text-xs text-gray-500 font-medium">
              <span>Комиссия агрегатора</span><span>~50%</span>
            </div>
            <div class="h-2.5 rounded-full bg-red-100 overflow-hidden">
              <div class="h-full bg-red-400 rounded-full grow-bar" style="width: 50%;"></div>
            </div>
          </div>
        </div>

        <!-- Давай вместе (good) -->
        <div class="rounded-card p-8 bg-primary/5 border-2 border-primary/20 relative overflow-hidden">
          <div class="absolute top-4 right-4 text-xs font-bold text-primary uppercase tracking-wider">Давай вместе</div>
          <div class="text-4xl mb-4">✨</div>
          <h3 class="font-bold text-xl text-gray-900 mb-3">Экспертиза вместо денег</h3>
          <p class="text-gray-600 text-sm leading-relaxed mb-4">
            Вы инвестируете время в статьи — и получаете личный бренд, авторитет и органический трафик. Капитал, который остаётся с вами.
          </p>
          <div class="space-y-2">
            <div class="flex justify-between text-xs text-gray-500 font-medium">
              <span>Ваш доход</span><span>100%</span>
            </div>
            <div class="h-2.5 rounded-full bg-primary/10 overflow-hidden">
              <div class="h-full bg-primary rounded-full grow-bar" style="width: 100%;"></div>
            </div>
            <div class="flex justify-between text-xs text-gray-500 font-medium">
              <span>Комиссия</span><span>0%</span>
            </div>
            <div class="h-2.5 rounded-full bg-primary/10 overflow-hidden">
              <div class="h-full bg-accent rounded-full grow-bar" style="width: 4%;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 4 преимущества статей -->
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="reveal card-hover bg-white rounded-card p-5 shadow-glass border border-neutral-light">
          <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl mb-4">🕐</div>
          <h4 class="font-bold text-gray-900 mb-1.5 text-sm">Работают 24/7</h4>
          <p class="text-xs text-gray-500 leading-relaxed">Приводят людей из Яндекса и Google, уже интересующихся вашей темой.</p>
        </div>
        <div class="reveal reveal-delay-1 card-hover bg-white rounded-card p-5 shadow-glass border border-neutral-light">
          <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl mb-4">🎭</div>
          <h4 class="font-bold text-gray-900 mb-1.5 text-sm">Демонстрируют стиль</h4>
          <p class="text-xs text-gray-500 leading-relaxed">Ещё до первой консультации отсеивают неподходящих и привлекают «ваших».</p>
        </div>
        <div class="reveal reveal-delay-2 card-hover bg-white rounded-card p-5 shadow-glass border border-neutral-light">
          <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl mb-4">🏆</div>
          <h4 class="font-bold text-gray-900 mb-1.5 text-sm">Закрепляют статус</h4>
          <p class="text-xs text-gray-500 leading-relaxed">Не только на сайте — во всём интернете, долгосрочно.</p>
        </div>
        <div class="reveal reveal-delay-3 card-hover bg-white rounded-card p-5 shadow-glass border border-neutral-light">
          <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl mb-4">📈</div>
          <h4 class="font-bold text-gray-900 mb-1.5 text-sm">Эффективнее блога</h4>
          <p class="text-xs text-gray-500 leading-relaxed">За счёт более мощного потока читателей через наш сайт.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ============================================================
       ЭКЗАМЕН
  ============================================================ -->
  <section id="exam" class="bg-background-subtle py-24 px-6 overflow-hidden">
    <div class="max-w-5xl mx-auto">

      <div class="reveal text-center mb-16">
        <span class="text-xs font-bold uppercase tracking-widest text-primary/70 mb-3 block">Квалификация</span>
        <h2 class="text-3xl sm:text-4xl font-extrabold text-gray-900 max-w-xl mx-auto leading-tight">
          Экзамен — объективное зеркало ваших навыков
        </h2>
        <p class="text-gray-600 mt-4 max-w-xl mx-auto">
          В каталог попадают только психологи, на практике доказавшие уровень своей квалификации.
        </p>
      </div>

      <!-- 3 столпа -->
      <div class="reveal grid md:grid-cols-3 gap-6 mb-14">
        <div class="card-hover bg-white rounded-card p-7 shadow-glass border border-neutral-light text-center">
          <div class="w-14 h-14 rounded-full bg-accent/30 flex items-center justify-center text-3xl mx-auto mb-5">🔍</div>
          <h3 class="font-bold text-gray-900 mb-2">Внешнее подтверждение</h3>
          <p class="text-gray-500 text-sm leading-relaxed">
            «Мой уровень проверен независимой экспертизой» — сильный аргумент для клиентов, которые сомневаются.
          </p>
        </div>
        <div class="card-hover bg-white rounded-card p-7 shadow-glass border border-neutral-light text-center">
          <div class="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-3xl mx-auto mb-5">💪</div>
          <h3 class="font-bold text-gray-900 mb-2">Внутренняя уверенность</h3>
          <p class="text-gray-500 text-sm leading-relaxed">
            Чёткое понимание своих сильных сторон и зон роста. Профессиональная самооценка, основанная на реальности.
          </p>
        </div>
        <div class="card-hover bg-white rounded-card p-7 shadow-glass border border-neutral-light text-center">
          <div class="w-14 h-14 rounded-full bg-accent/30 flex items-center justify-center text-3xl mx-auto mb-5">💬</div>
          <h3 class="font-bold text-gray-900 mb-2">Честная диагностика</h3>
          <p class="text-gray-500 text-sm leading-relaxed">
            Не получилось — получаете обратную связь с конкретными точками роста. Это тоже ценность.
          </p>
        </div>
      </div>

      <!-- Варианты подготовки -->
      <div class="reveal grid md:grid-cols-2 gap-6">

        <div class="card-hover bg-white rounded-card p-8 shadow-glass border-2 border-neutral-light relative">
          <div class="absolute top-0 left-0 w-1 h-full bg-neutral-light rounded-l-card"></div>
          <h3 class="font-bold text-xl text-gray-900 mb-3 flex items-center gap-2">
            <span class="text-2xl">🎯</span> Самостоятельная сдача
          </h3>
          <p class="text-gray-600 text-sm leading-relaxed">
            Если вы уверены в своих силах и готовы подтвердить уровень без дополнительной подготовки.
          </p>
          <div class="mt-5 text-xs text-neutral-dark font-medium uppercase tracking-wide">Подходит для опытных специалистов</div>
        </div>

        <div class="card-hover bg-primary text-white rounded-card p-8 shadow-glass-strong relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
          <div class="absolute -bottom-8 -right-8 w-32 h-32 blob bg-white/10"></div>
          <div class="relative z-10">
            <div class="inline-flex items-center gap-1.5 text-xs font-bold bg-accent text-gray-900 px-3 py-1 rounded-full mb-4">
              ⭐ Рекомендуем
            </div>
            <h3 class="font-bold text-xl mb-3 flex items-center gap-2">
              <span class="text-2xl">📚</span> Курс + экзамен
            </h3>
            <p class="text-white/80 text-sm leading-relaxed">
              Пройти курс Школы психологии Сергея Смирнова с последующей обязательной аттестацией. Максимальная подготовка.
            </p>
            <div class="mt-5 text-xs text-white/60 font-medium uppercase tracking-wide">Структурированная подготовка</div>
          </div>
        </div>
      </div>

      <!-- Cert vs diploma comparison -->
      <div class="reveal mt-10 bg-white rounded-card p-7 shadow-glass border border-neutral-light">
        <div class="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-light gap-6 md:gap-0">
          <div class="md:pr-8 pb-6 md:pb-0">
            <div class="text-xs font-bold uppercase tracking-widest text-neutral-dark mb-3">Сертификат с курса</div>
            <p class="text-2xl font-extrabold text-gray-400 mb-2">"Я прослушал курс"</p>
            <p class="text-sm text-gray-500">Подтверждает факт присутствия. Не говорит ничего о реальных умениях.</p>
          </div>
          <div class="md:pl-8 pt-6 md:pt-0">
            <div class="text-xs font-bold uppercase tracking-widest text-primary mb-3">Уровень «Давай вместе»</div>
            <p class="text-2xl font-extrabold text-gray-900 mb-2">"Я доказал, что умею"</p>
            <p class="text-sm text-gray-500">Подтверждает практическое применение знаний. Весомо для клиентов.</p>
          </div>
        </div>
      </div>

    </div>
  </section>

  <!-- ============================================================
       ВЗАИМНЫЙ ВКЛАД — правила
  ============================================================ -->
  <section class="bg-background py-24 px-6">
    <div class="max-w-4xl mx-auto">

      <div class="reveal text-center mb-14">
        <span class="text-xs font-bold uppercase tracking-widest text-primary/70 mb-3 block">Условия</span>
        <h2 class="text-3xl sm:text-4xl font-extrabold text-gray-900">
          Взаимный вклад
        </h2>
        <p class="text-gray-600 mt-3 max-w-lg mx-auto">
          Экспертиза в обмен на продвижение и доверие — честный обмен без скрытых условий.
        </p>
      </div>

      <div class="reveal grid md:grid-cols-2 gap-6">

        <!-- Требования к статьям -->
        <div class="card-hover bg-white rounded-card p-7 shadow-glass border border-neutral-light">
          <div class="flex items-center gap-3 mb-5">
            <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">📝</div>
            <h3 class="font-bold text-gray-900 text-lg">Требования к статьям</h3>
          </div>
          <ul class="space-y-3">
            <li class="flex items-start gap-2.5 text-sm text-gray-600">
              <svg class="w-4 h-4 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
              </svg>
              Статья должна быть уникальной и полезной
            </li>
            <li class="flex items-start gap-2.5 text-sm text-gray-600">
              <svg class="w-4 h-4 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
              </svg>
              Проходит модерацию редакции
            </li>
            <li class="flex items-start gap-2.5 text-sm text-gray-600">
              <svg class="w-4 h-4 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
              </svg>
              Одна статья в месяц — минимум
            </li>
            <li class="flex items-start gap-2.5 text-sm text-gray-600">
              <svg class="w-4 h-4 text-accent-hover mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
              </svg>
              Больше статей — больше присутствия
            </li>
          </ul>
        </div>

        <!-- Если статьи нет -->
        <div class="card-hover bg-amber-50 rounded-card p-7 border border-amber-100">
          <div class="flex items-center gap-3 mb-5">
            <div class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl">⚠️</div>
            <h3 class="font-bold text-gray-900 text-lg">Если статьи нет</h3>
          </div>
          <p class="text-sm text-gray-600 leading-relaxed mb-4">
            Анкета временно скрывается из каталога. Чтобы вернуться — нужно восполнить недостающие материалы.
          </p>
          <div class="bg-white/80 rounded-xl p-4 border border-amber-100">
            <p class="text-xs text-amber-700 font-medium">
              💡 Если вы ведёте практику — у вас точно есть клиентские случаи, инсайты и ответы на частые вопросы. Это и есть лучшие темы для статей.
            </p>
          </div>
        </div>

      </div>
    </div>
  </section>

  <!-- ============================================================
       ДЛЯ КОГО / НЕ ДЛЯ КОГО
  ============================================================ -->
  <section class="bg-background-subtle py-24 px-6">
    <div class="max-w-5xl mx-auto">

      <div class="reveal text-center mb-14">
        <span class="text-xs font-bold uppercase tracking-widest text-primary/70 mb-3 block">Честно о формате</span>
        <h2 class="text-3xl sm:text-4xl font-extrabold text-gray-900">
          Этот формат — для вас?
        </h2>
      </div>

      <div class="reveal grid md:grid-cols-2 gap-8">

        <!-- Да -->
        <div class="card-hover bg-white rounded-card p-8 shadow-glass border border-neutral-light">
          <div class="inline-flex items-center gap-2 bg-accent/20 border border-accent/40 text-green-800 text-xs font-bold px-3 py-1 rounded-full mb-6">
            ✓ Это для вас
          </div>
          <ul class="space-y-4">
            <li class="flex items-start gap-3">
              <span class="w-7 h-7 rounded-full bg-accent/30 flex items-center justify-center text-base flex-shrink-0 mt-0.5">✅</span>
              <div>
                <p class="font-semibold text-gray-900 text-sm">Цените прямой контакт с клиентом</p>
                <p class="text-xs text-gray-500 mt-0.5">Без посредников и платформенных правил</p>
              </div>
            </li>
            <li class="flex items-start gap-3">
              <span class="w-7 h-7 rounded-full bg-accent/30 flex items-center justify-center text-base flex-shrink-0 mt-0.5">✅</span>
              <div>
                <p class="font-semibold text-gray-900 text-sm">Готовы подтвердить работу делом</p>
                <p class="text-xs text-gray-500 mt-0.5">Не только словами и дипломами</p>
              </div>
            </li>
            <li class="flex items-start gap-3">
              <span class="w-7 h-7 rounded-full bg-accent/30 flex items-center justify-center text-base flex-shrink-0 mt-0.5">✅</span>
              <div>
                <p class="font-semibold text-gray-900 text-sm">Видите смысл в экспертной публичности</p>
                <p class="text-xs text-gray-500 mt-0.5">Статьи как способ выражения и привлечения</p>
              </div>
            </li>
          </ul>
        </div>

        <!-- Нет -->
        <div class="card-hover bg-white rounded-card p-8 shadow-glass border border-neutral-light">
          <div class="inline-flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full mb-6">
            ✕ Не подходит, если
          </div>
          <ul class="space-y-4">
            <li class="flex items-start gap-3">
              <span class="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center text-base flex-shrink-0 mt-0.5">❌</span>
              <div>
                <p class="font-semibold text-gray-500 text-sm line-through decoration-red-300">Статьи — пустая трата времени</p>
                <p class="text-xs text-gray-400 mt-0.5">Возможно, просто другой формат роста</p>
              </div>
            </li>
            <li class="flex items-start gap-3">
              <span class="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center text-base flex-shrink-0 mt-0.5">❌</span>
              <div>
                <p class="font-semibold text-gray-500 text-sm line-through decoration-red-300">Не готовы к объективной проверке</p>
                <p class="text-xs text-gray-400 mt-0.5">Экзамен — обязательное условие</p>
              </div>
            </li>
            <li class="flex items-start gap-3">
              <span class="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center text-base flex-shrink-0 mt-0.5">❌</span>
              <div>
                <p class="font-semibold text-gray-500 text-sm line-through decoration-red-300">Клиенты без усилий</p>
                <p class="text-xs text-gray-400 mt-0.5">Здесь нужно немного, но регулярно</p>
              </div>
            </li>
          </ul>
        </div>

      </div>
    </div>
  </section>

  <!-- ============================================================
       FAQ
  ============================================================ -->
  <section class="bg-background py-24 px-6">
    <div class="max-w-3xl mx-auto">

      <div class="reveal text-center mb-14">
        <span class="text-xs font-bold uppercase tracking-widest text-primary/70 mb-3 block">Вопросы и ответы</span>
        <h2 class="text-3xl sm:text-4xl font-extrabold text-gray-900">
          Частые вопросы психологов
        </h2>
      </div>

      <div class="reveal space-y-3">

        <!-- FAQ 1 -->
        <div class="faq-item bg-white rounded-card border border-neutral-light shadow-glass overflow-hidden cursor-pointer" onclick="toggleFaq(this)">
          <div class="flex items-center justify-between p-6 gap-4">
            <h3 class="font-semibold text-gray-900 text-sm sm:text-base leading-snug">
              А если у меня нет времени или идей для статей каждый месяц?
            </h3>
            <svg class="faq-chevron flex-shrink-0 w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </div>
          <div class="faq-answer">
            <div class="px-6 pb-6 text-sm text-gray-600 leading-relaxed border-t border-neutral-light pt-4">
              Если вы ведёте практику, у вас точно есть клиентские случаи, инсайты, ответы на частые вопросы клиентов. Это и есть лучшие темы для статей — то, о чём вы и так думаете каждый день.
            </div>
          </div>
        </div>

        <!-- FAQ 2 -->
        <div class="faq-item bg-white rounded-card border border-neutral-light shadow-glass overflow-hidden cursor-pointer" onclick="toggleFaq(this)">
          <div class="flex items-center justify-between p-6 gap-4">
            <h3 class="font-semibold text-gray-900 text-sm sm:text-base leading-snug">
              Чем ваш уровень лучше сертификата с курса?
            </h3>
            <svg class="faq-chevron flex-shrink-0 w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </div>
          <div class="faq-answer">
            <div class="px-6 pb-6 text-sm text-gray-600 leading-relaxed border-t border-neutral-light pt-4">
              Сертификат говорит: «Я прослушал курс». Наш уровень говорит: «Я доказал, что умею применять эти знания на практике». Для клиента разница принципиальная — первое можно получить, просто просидев на вебинаре.
            </div>
          </div>
        </div>

        <!-- FAQ 3 -->
        <div class="faq-item bg-white rounded-card border border-neutral-light shadow-glass overflow-hidden cursor-pointer" onclick="toggleFaq(this)">
          <div class="flex items-center justify-between p-6 gap-4">
            <h3 class="font-semibold text-gray-900 text-sm sm:text-base leading-snug">
              Что будет, если мою статью не примут?
            </h3>
            <svg class="faq-chevron flex-shrink-0 w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </div>
          <div class="faq-answer">
            <div class="px-6 pb-6 text-sm text-gray-600 leading-relaxed border-t border-neutral-light pt-4">
              Модератор даст обратную связь с конкретным объяснением причин. Вы сможете доработать материал или предложить новую тему. Это не блокировка — это диалог.
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>

  <!-- ============================================================
       FINAL CTA
  ============================================================ -->
  <section class="bg-primary py-28 px-6 relative overflow-hidden">

    <!-- Background decoration -->
    <div class="blob absolute -top-16 -right-16 w-80 h-80 bg-white/5 pointer-events-none"></div>
    <div class="blob absolute -bottom-20 -left-20 w-96 h-96 bg-white/5 pointer-events-none" style="animation-delay:-4s;"></div>

    <!-- Dot grid -->
    <div class="absolute inset-0 opacity-[0.07] pointer-events-none" aria-hidden="true">
      <svg width="100%" height="100%">
        <defs>
          <pattern id="dots-cta" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="white"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots-cta)"/>
      </svg>
    </div>

    <div class="relative z-10 max-w-3xl mx-auto text-center">
      <div class="reveal inline-flex items-center gap-2 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium text-white/70 mb-8">
        <span class="w-2 h-2 rounded-full bg-accent animate-pulse inline-block"></span>
        Открытый набор
      </div>
      <h2 class="reveal reveal-delay-1 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-5">
        Хочешь получать клиентов?<br/>
        <span class="text-accent">Давай вместе!</span>
      </h2>
      <p class="reveal reveal-delay-2 text-lg text-white/70 mb-10 max-w-xl mx-auto leading-relaxed">
        Докажи свой уровень квалификации делом и присоединяйся к сообществу, где главное — быть хорошим психологом.
      </p>
      <div class="reveal reveal-delay-3 flex flex-wrap justify-center gap-4">
        <a href="#" class="btn-accent rounded-button px-8 py-4 font-bold text-base inline-flex items-center gap-2 shadow-lg">
          Подтвердить уровень и разместить анкету
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
          </svg>
        </a>
      </div>
      <p class="reveal reveal-delay-4 text-white/40 text-xs mt-6">Бесплатно · Без комиссии · Навсегда</p>
    </div>
  </section>`,
      customHead: `<link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    body { font-family: 'Inter', system-ui, sans-serif; }

    /* Intersection Observer анимации */
    .reveal {
      opacity: 0;
      transform: translateY(28px);
      transition: opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1),
                  transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .reveal.visible {
      opacity: 1;
      transform: translateY(0);
    }
    .reveal-delay-1 { transition-delay: 0.1s; }
    .reveal-delay-2 { transition-delay: 0.2s; }
    .reveal-delay-3 { transition-delay: 0.3s; }
    .reveal-delay-4 { transition-delay: 0.4s; }

    /* Gradient mesh для hero */
    .hero-mesh {
      background:
        radial-gradient(ellipse 80% 60% at 60% 30%, rgba(88, 88, 226, 0.10) 0%, transparent 70%),
        radial-gradient(ellipse 50% 40% at 20% 80%, rgba(167, 255, 90, 0.10) 0%, transparent 60%),
        #F8F7F4;
    }

    /* Accent blob */
    .blob {
      border-radius: 60% 40% 70% 30% / 50% 60% 40% 50%;
      animation: blobMorph 8s ease-in-out infinite;
    }
    @keyframes blobMorph {
      0%, 100% { border-radius: 60% 40% 70% 30% / 50% 60% 40% 50%; }
      33%       { border-radius: 40% 60% 30% 70% / 60% 40% 60% 40%; }
      66%       { border-radius: 70% 30% 50% 50% / 40% 70% 30% 60%; }
    }

    /* Hover card lift */
    .card-hover {
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                  box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .card-hover:hover {
      transform: translateY(-4px);
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.10);
    }

    /* Step connector line */
    .step-line::after {
      content: '';
      position: absolute;
      left: 1.75rem;
      top: 3.5rem;
      width: 2px;
      height: calc(100% - 1rem);
      background: linear-gradient(to bottom, #5858E2 0%, rgba(88,88,226,0.1) 100%);
    }

    /* Progress bar animate */
    @keyframes growWidth {
      from { width: 0; }
    }
    .grow-bar {
      animation: growWidth 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    /* Tag pill */
    .pill-yes {
      background: rgba(167, 255, 90, 0.18);
      color: #3a7a1a;
      border: 1px solid rgba(167, 255, 90, 0.45);
    }
    .pill-no {
      background: rgba(200, 60, 60, 0.08);
      color: #922;
      border: 1px solid rgba(200, 60, 60, 0.20);
    }

    /* FAQ accordion */
    .faq-answer {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1),
                  padding 0.3s ease;
    }
    .faq-item.open .faq-answer { max-height: 200px; }
    .faq-item.open .faq-chevron { transform: rotate(180deg); }
    .faq-chevron { transition: transform 0.3s ease; }

    /* Glow button */
    .btn-primary {
      background: #5858E2;
      color: white;
      position: relative;
      overflow: hidden;
      transition: background 0.2s, box-shadow 0.2s, transform 0.15s;
    }
    .btn-primary::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
      pointer-events: none;
    }
    .btn-primary:hover {
      background: #4646c9;
      box-shadow: 0 8px 32px rgba(88, 88, 226, 0.40);
      transform: translateY(-1px);
    }
    .btn-accent {
      background: #A7FF5A;
      color: #1a1a1a;
      transition: background 0.2s, box-shadow 0.2s, transform 0.15s;
    }
    .btn-accent:hover {
      background: #8ee64a;
      box-shadow: 0 8px 28px rgba(167, 255, 90, 0.45);
      transform: translateY(-1px);
    }

    /* Ticker / marquee */
    @keyframes marquee {
      from { transform: translateX(0); }
      to   { transform: translateX(-50%); }
    }
    .marquee-track {
      animation: marquee 22s linear infinite;
      white-space: nowrap;
    }
    .marquee-track:hover { animation-play-state: paused; }
  </style>
  <script>
    // Reveal on scroll
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

    // FAQ toggle
    function toggleFaq(item) {
      const isOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item").forEach(i => i.classList.remove("open"));
      if (!isOpen) item.classList.add("open");
    }

    // Animate progress bars when visible
    const barObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll(".grow-bar").forEach(bar => {
              bar.style.animationPlayState = "running";
            });
          }
        });
      },
      { threshold: 0.3 }
    );
    document.querySelectorAll(".grow-bar").forEach(bar => {
      bar.style.animationPlayState = "paused";
    });
    document.querySelectorAll(".grid").forEach(grid => barObserver.observe(grid));
  </script>`,
      images: [],
      isPublished: false,
    },
  ]

  for (const page of pages) {
    await prisma.page.upsert({
      where: { slug: page.slug },
      update: {},
      create: page,
    })
    console.log(`  ✅ Страница ${page.slug} создана/проверена`)
  }

  console.log('\n✅ Сидирование завершено!\n')
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при сидировании:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
