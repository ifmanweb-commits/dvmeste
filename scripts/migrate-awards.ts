/**
 * Скрипт для миграции данных наград из CertificationAward в таблицу Award
 * 
 * Запуск: npx tsx scripts/migrate-awards.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Начало миграции наград...');

  // Получаем все CertificationAward с связанными сертификациями
  const certificationAwards = await prisma.certificationAward.findMany({
    include: {
      certification: true,
      user: true,
    },
  });

  console.log(`Найдено ${certificationAwards} записей CertificationAward`);

  let createdCount = 0;
  let skippedCount = 0;

  for (const certAward of certificationAwards) {
    const certification = certAward.certification;

    // Если у сертификации нет awardId, пропускаем
    if (!certification) {
      console.log(`Пропущено: CertificationAward ${certAward.id} без сертификации`);
      skippedCount++;
      continue;
    }

    // Проверяем, есть ли уже связанная Award
    if (certification.awardId) {
      // Проверяем, существует ли уже Award с такими данными
      let existingAward = await prisma.award.findFirst({
        where: {
          certifications: {
            some: {
              id: certification.id,
            },
          },
        },
      });

      // Если Award уже есть, просто обновляем CertificationAward
      if (existingAward) {
        await prisma.certificationAward.update({
          where: { id: certAward.id },
          data: { awardId: existingAward.id },
        });
        console.log(`Обновлено: CertificationAward ${certAward.id} -> Award ${existingAward.id}`);
        skippedCount++;
        continue;
      }
    }

    // Создаём новую Award на основе данных Certification
    const awardData = {
      name: certification.title,
      type: 'CERTIFICATE' as const, // По умолчанию сертификат
      badgeUrl: null,
      certificateTemplateId: certification.certificateTemplateId,
      awardText: certification.awardText,
      isPublic: false, // По умолчанию не публичная
    };

    // Создаём Award
    const newAward = await prisma.award.create({
      data: awardData,
    });

    console.log(`Создана Award ${newAward.id} для сертификации ${certification.id}`);
    createdCount++;

    // Обновляем Certification с ссылкой на новую Award
    await prisma.certification.update({
      where: { id: certification.id },
      data: { awardId: newAward.id },
    });

    console.log(`Обновлена Certification ${certification.id} с awardId ${newAward.id}`);
  }

  console.log(`\nМиграция завершена!`);
  console.log(`Создано наград: ${createdCount}`);
  console.log(`Пропущено записей: ${skippedCount}`);
}

main()
  .catch((e) => {
    console.error('Ошибка миграции:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });