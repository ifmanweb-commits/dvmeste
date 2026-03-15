import { PrismaClient, PsychologistStatus, ModerationStatus } from "@prisma/client";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

// Вспомогательные функции
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}

function generateArticleSlug(title: string): string {
  return generateSlug(title) + "-" + randomInt(1000, 9999);
}

// Данные для генерации
const firstNames = [
  "Анна", "Мария", "Елена", "Ольга", "Наталья", "Ирина", "Екатерина", "Татьяна",
  "Александр", "Дмитрий", "Сергей", "Андрей", "Михаил", "Павел", "Игорь", "Константин"
];

const lastNames = [
  "Иванова", "Петрова", "Сидорова", "Смирнова", "Козлова", "Новикова", "Морозова", "Попова",
  "Иванов", "Петров", "Сидоров", "Смирнов", "Козлов", "Новиков", "Морозов", "Попов"
];

const cities = [
  "Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург", "Казань",
  "Нижний Новгород", "Челябинск", "Самара", "Омск", "Ростов-на-Дону",
  "Уфа", "Красноярск", "Воронеж", "Пермь", "Волгоград"
];

const paradigms = [
  "Когнитивно-поведенческая терапия",
  "Психоанализ",
  "Гештальт-терапия",
  "Системная семейная терапия",
  "Телесно-ориентированная терапия",
  "Арт-терапия",
  "Экзистенциальная терапия",
  "Клиент-центрированная терапия"
];

const workFormats = ["ONLINE", "OFFLINE", "BOTH"];

const shortBios = [
  "Помогаю справиться с тревогой, депрессией и проблемами в отношениях. Индивидуальный подход к каждому клиенту.",
  "Работаю с вопросами самооценки, выгорания и жизненных кризисов. Более 5 лет практики.",
  "Специализируюсь на семейной терапии и вопросах родительства. Создаю безопасное пространство для диалога.",
  "Помогаю найти внутренние ресурсы и преодолеть жизненные трудности. Работаю в подходе КПТ.",
  "Работаю с травмой, ПТСР и сложными эмоциональными состояниями. Бережный и поддерживающий подход.",
  "Консультирую по вопросам профориентации, карьеры и самоопределения. Экзистенциальный подход.",
  "Помогаю наладить отношения с партнёром и близкими. Системная семейная терапия.",
  "Специализируюсь на работе с детско-родительскими отношениями и возрастными кризисами."
];

const articleTitles = [
  "Как справиться с тревожностью: 5 практических техник",
  "Что такое эмоциональное выгорание и как его предотвратить",
  "Границы в отношениях: как научиться говорить «нет»",
  "Кризис среднего возраста: миф или реальность?",
  "Как пережить расставание: советы психолога",
  "Детские травмы и их влияние на взрослую жизнь",
  "Самооценка: как научиться себя ценить",
  "Тревога и страх: в чём разница и как с ними работать",
  "Как построить здоровые отношения с партнёром",
  "Что делать, если вы потеряли смысл жизни",
  "Перфекционизм: друг или враг?",
  "Как справиться с гневом и агрессией",
  "Родительские послания: как они влияют на нашу жизнь",
  "Синдром самозванца: почему мы не верим в свой успех",
  "Эмоциональный интеллект: зачем он нужен и как развить"
];

const articleContents = [
  `<p>В современном мире тревожность стала частым спутником многих людей. В этой статье я расскажу о пяти техниках, которые помогут снизить уровень тревоги.</p>
  
  <h2>1. Дыхательные упражнения</h2>
  <p>Глубокое диафрагмальное дыхание активирует парасимпатическую нервную систему и помогает успокоиться. Попробуйте технику «4-7-8»: вдох на 4 счёта, задержка на 7, выдох на 8.</p>
  
  <h2>2. Заземление</h2>
  <p>Техника «5-4-3-2-1» помогает вернуться в настоящий момент: найдите 5 вещей, которые вы видите, 4 — которые можете потрогать, 3 — которые слышите, 2 — которые чувствуете по запаху, и 1 — которую можете попробовать на вкус.</p>
  
  <h2>3. Когнитивная переоценка</h2>
  <p>Запишите тревожные мысли и попробуйте найти альтернативные, более реалистичные интерпретации ситуации.</p>
  
  <h2>4. Физическая активность</h2>
  <p>Регулярные упражнения снижают уровень кортизола и повышают настроение.</p>
  
  <h2>5. Поддержка близких</h2>
  <p>Не бойтесь просить о помощи. Разговор с доверенным лицом может значительно облегчить состояние.</p>`,

  `<p>Эмоциональное выгорание — это состояние физического и эмоционального истощения, которое часто возникает у людей помогающих профессий.</p>
  
  <h2>Симптомы выгорания</h2>
  <ul>
    <li>Хроническая усталость</li>
    <li>Цинизм и отстранённость</li>
    <li>Снижение продуктивности</li>
    <li>Физические симптомы (головные боли, нарушения сна)</li>
  </ul>
  
  <h2>Профилактика</h2>
  <p>Важно регулярно заботиться о себе: устанавливать границы, находить время для отдыха и хобби, поддерживать социальные связи.</p>`,

  `<p>Личные границы — это правила, которые определяют, как другие люди могут обращаться с нами. Они защищают наше физическое и эмоциональное пространство.</p>
  
  <h2>Почему сложно говорить «нет»</h2>
  <p>Часто мы боимся обидеть человека, показаться эгоистами или потерять отношения. Но отсутствие границ ведёт к resentment — накопленной обиде.</p>
  
  <h2>Как научиться отказывать</h2>
  <ol>
    <li>Определите свои приоритеты</li>
    <li>Используйте «Я-сообщения»</li>
    <li>Предложите альтернативу</li>
    <li>Помните: вы имеете право на свои потребности</li>
  </ol>`,

  `<p>Кризис среднего возраста — это период переоценки ценностей, который часто происходит между 35 и 50 годами.</p>
  
  <h2>Признаки кризиса</h2>
  <ul>
    <li>Вопросы «А туда ли я иду?»</li>
    <li>Желание резко всё изменить</li>
    <li>Ностальгия по молодости</li>
    <li>Неудовлетворённость достижениями</li>
  </ul>
  
  <blockquote>Кризис — это не только проблема, но и возможность для роста.</blockquote>
  
  <p>Важно принять свои чувства и рассмотреть их как сигнал о необходимости изменений.</p>`,

  `<p>Расставание — одно из самых болезненных переживаний в жизни человека.</p>
  
  <h2>Стадии переживания расставания</h2>
  <ol>
    <li>Отрицание</li>
    <li>Гнев</li>
    <li>Торг</li>
    <li>Депрессия</li>
    <li>Принятие</li>
  </ol>
  
  <h2>Что помогает</h2>
  <ul>
    <li>Дать себе время горевать</li>
    <li>Поддержка друзей и близких</li>
    <li>Забота о себе</li>
    <li>Новые занятия и хобби</li>
  </ul>`
];

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
];

// Генерация психологов
async function seedPsychologists() {
  console.log("🧠 Генерация психологов...");

  const psychologists = [];
  const photoIndex = 0;

  // ACTIVE психологи (8-10 человек)
  const activeCount = 9;
  for (let i = 0; i < activeCount; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const fullName = `${firstName} ${lastName}`;
    const email = `psychologist${i + 1}@test.local`;
    const city = randomElement(cities);
    const paradigmsCount = randomInt(1, 3);
    const selectedParadigms: string[] = [];
    const paradigmsCopy = [...paradigms];
    for (let j = 0; j < paradigmsCount; j++) {
      const idx = Math.floor(Math.random() * paradigmsCopy.length);
      selectedParadigms.push(paradigmsCopy.splice(idx, 1)[0]);
    }

    const diplomaYear = randomInt(2015, 2023);
    const diplomaMonth = randomInt(1, 12);

    const psychologist = await prisma.user.create({
      data: {
        email,
        emailVerified: new Date(),
        fullName,
        slug: generateSlug(fullName) + "-" + randomInt(1, 99),
        status: "ACTIVE" as PsychologistStatus,
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
        avatarUrl: `/tmp-photos/${photoFiles[i % photoFiles.length]}`,
      },
    });

    // Добавляем фото (Document типа PHOTO)
    const photoCount = randomInt(2, 4);
    for (let j = 0; j < photoCount; j++) {
      await prisma.document.create({
        data: {
          userId: psychologist.id,
          type: "PHOTO",
          url: `/tmp-photos/${photoFiles[(i + j) % photoFiles.length]}`,
          filename: photoFiles[(i + j) % photoFiles.length],
          mimeType: "image/jpeg",
          size: randomInt(100000, 500000),
          description: j === 0 ? "Основное фото" : `Дополнительное фото ${j}`,
        },
      });
    }

    // Добавляем документы (дипломы)
    const docCount = randomInt(2, 5);
    for (let j = 0; j < docCount; j++) {
      const docType = randomElement(["ACADEMIC_EDUCATION", "PROFESSIONAL_TRAINING", "COURSE"] as const);
      await prisma.document.create({
        data: {
          userId: psychologist.id,
          type: docType,
          url: `/tmp-photos/${photoFiles[(i + j + 5) % photoFiles.length]}`,
          filename: `diploma_${i}_${j}.jpg`,
          mimeType: "image/jpeg",
          size: randomInt(100000, 500000),
          description: docType === "ACADEMIC_EDUCATION" ? "Диплом о высшем образовании" : 
                       docType === "PROFESSIONAL_TRAINING" ? "Сертификат о переподготовке" : "Сертификат о курсах",
          organization: randomElement(["МГУ", "СПбГУ", "МГППУ", "Институт психологии РАН"]),
          programName: "Психологическое консультирование",
          year: randomInt(2015, 2023),
        },
      });
    }

    psychologists.push(psychologist);
    console.log(`  ✓ ACTIVE: ${fullName} (${city})`);
  }

  // CANDIDATE психологи (3-5 человек)
  const candidateCount = 4;
  for (let i = 0; i < candidateCount; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const fullName = `${firstName} ${lastName}`;
    const email = `candidate${i + 1}@test.local`;

    const psychologist = await prisma.user.create({
      data: {
        email,
        emailVerified: null,
        fullName,
        slug: generateSlug(fullName) + "-" + randomInt(1, 99),
        status: "CANDIDATE" as PsychologistStatus,
        isPublished: false,
        gender: randomElement(["Женский", "Мужской"]),
        city: randomElement(cities),
        workFormat: randomElement(workFormats),
        mainParadigm: [randomElement(paradigms)],
        certificationLevel: 0,
        shortBio: randomElement(shortBios),
        price: randomInt(1500, 4000),
        contactInfo: `Email: candidate${i + 1}@test.local`,
      },
    });

    // Добавляем 1-2 фото
    const photoCount = randomInt(1, 2);
    for (let j = 0; j < photoCount; j++) {
      await prisma.document.create({
        data: {
          userId: psychologist.id,
          type: "PHOTO",
          url: `/tmp-photos/${photoFiles[(activeCount + i + j) % photoFiles.length]}`,
          filename: photoFiles[(activeCount + i + j) % photoFiles.length],
          mimeType: "image/jpeg",
          size: randomInt(100000, 500000),
        },
      });
    }

    psychologists.push(psychologist);
    console.log(`  ✓ CANDIDATE: ${fullName}`);
  }

  // PENDING психологи (2-3 человека)
  const pendingCount = 3;
  for (let i = 0; i < pendingCount; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const fullName = `${firstName} ${lastName}`;
    const email = `pending${i + 1}@test.local`;

    const psychologist = await prisma.user.create({
      data: {
        email,
        fullName,
        slug: generateSlug(fullName) + "-" + randomInt(1, 99),
        status: "PENDING" as PsychologistStatus,
        isPublished: false,
        city: randomElement(cities),
        workFormat: randomElement(workFormats),
        mainParadigm: [randomElement(paradigms)],
        certificationLevel: 0,
        shortBio: randomElement(shortBios),
        price: randomInt(1000, 3000),
        contactInfo: `Телефон: +7 (999) ${randomInt(100, 999)}-${randomInt(10, 99)}-${randomInt(10, 99)}`,
      },
    });

    psychologists.push(psychologist);
    console.log(`  ✓ PENDING: ${fullName}`);
  }

  // BLOCKED психологи (1-2 человека)
  const blockedCount = 2;
  for (let i = 0; i < blockedCount; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const fullName = `${firstName} ${lastName}`;
    const email = `blocked${i + 1}@test.local`;

    const psychologist = await prisma.user.create({
      data: {
        email,
        fullName,
        slug: generateSlug(fullName) + "-" + randomInt(1, 99),
        status: "BLOCKED" as PsychologistStatus,
        isPublished: false,
        city: randomElement(cities),
        workFormat: "ONLINE",
        mainParadigm: [randomElement(paradigms)],
        certificationLevel: randomInt(1, 2),
        shortBio: randomElement(shortBios),
        price: randomInt(2000, 5000),
      },
    });

    psychologists.push(psychologist);
    console.log(`  ✓ BLOCKED: ${fullName}`);
  }

  console.log(`✅ Создано психологов: ${psychologists.length}\n`);
  return psychologists;
}

// Генерация статей
async function seedArticles(psychologists: any[]) {
  console.log("📝 Генерация статей...");

  const activePsychologists = psychologists.filter((p: any) => p.status === "ACTIVE");
  let articleCount = 0;

  for (const psychologist of activePsychologists) {
    // У каждого активного психолога 0-5 статей
    const articlesForUser = randomInt(0, 5);

    for (let i = 0; i < articlesForUser; i++) {
      const title = randomElement(articleTitles);
      const content = randomElement(articleContents);
      const isPublished = Math.random() > 0.2; // 80% опубликованы
      const moderationStatus = isPublished 
        ? ("APPROVED" as ModerationStatus) 
        : randomElement(["DRAFT", "PENDING"] as ModerationStatus[]);

      const article = await prisma.article.create({
        data: {
          title: `${title} ${randomInt(1, 100)}`,
          slug: generateArticleSlug(title),
          content,
          excerpt: content.replace(/<[^>]+>/g, "").slice(0, 200) + "...",
          userId: psychologist.id,
          isPublished,
          publishedAt: isPublished ? new Date(Date.now() - randomInt(0, 30 * 24 * 60 * 60 * 1000)) : null,
          moderationStatus,
          tags: [randomElement(paradigms).split(" ")[0], randomElement(["психология", "терапия", "самопомощь"])],
          image: `/tmp-photos/${randomElement(photoFiles)}`,
        },
      });

      articleCount++;
      console.log(`  ✓ Статья: "${article.title}" — ${psychologist.fullName} (${isPublished ? "опубл." : "черновик"})`);
    }
  }

  console.log(`✅ Создано статей: ${articleCount}\n`);
}

// Очистка базы перед заполнением
async function clearExistingData() {
  console.log("🧹 Очистка существующих данных...");

  await prisma.articleImage.deleteMany();
  await prisma.articleCredit.deleteMany();
  await prisma.document.deleteMany();
  await prisma.article.deleteMany();
  await prisma.moderationRecord.deleteMany();
  await prisma.session.deleteMany();

  // Удаляем только тестовых пользователей (не админов и не менеджеров)
  await prisma.user.deleteMany({
    where: {
      isAdmin: false,
      isManager: false,
      email: {
        contains: "@test.local",
      },
    },
  });

  console.log("✅ Очистка завершена\n");
}

// Основная функция
async function main() {
  console.log("🌱 Запуск сидирования тестовых данных...\n");

  await clearExistingData();
  const psychologists = await seedPsychologists();
  await seedArticles(psychologists);

  console.log("🎉 Готово! База заполнена тестовыми данными.");
}

main()
  .catch((e) => {
    console.error("❌ Ошибка:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
