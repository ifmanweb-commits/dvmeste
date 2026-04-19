/**
 * Скрипт для восстановления связи между CertificationAward и Award
 * 
 * Проблема: после миграции наград в таблицу Award, CertificationAward записи
 * не были связаны с Award через awardId, хотя Certification имеет awardId.
 * 
 * Решение: для каждой CertificationAward найти соответствующую Certification
 * и скопировать awardId в CertificationAward.
 */

import { prisma } from '../lib/prisma';

async function main() {
  console.log('🔍 Поиск CertificationAward без связи с Award...');

  // Находим все CertificationAward, у которых awardId IS NULL
  const awardsWithoutAward = await prisma.certificationAward.findMany({
    where: {
      awardId: null,
    },
    include: {
      certification: {
        select: {
          id: true,
          awardId: true,
          title: true,
        },
      },
    },
  });

  console.log(`Найдено ${awardsWithoutAward.length} записей без связи с Award`);

  if (awardsWithoutAward.length === 0) {
    console.log('✅ Все CertificationAward уже связаны с Award');
    return;
  }

  // Фильтруем только те, у которых certification имеет awardId
  const awardsToFix = awardsWithoutAward.filter(
    (award): award is typeof award & { certification: NonNullable<typeof award.certification> } => 
      award.certification !== null && award.certification.awardId !== null
  );

  console.log(`Из них ${awardsToFix.length} имеют certification с awardId`);

  if (awardsToFix.length === 0) {
    console.log('❌ Нет записей для исправления');
    return;
  }

  // Обновляем каждую запись
  let updatedCount = 0;
  for (const award of awardsToFix) {
    try {
      await prisma.certificationAward.update({
        where: { id: award.id },
        data: {
          awardId: award.certification.awardId,
        },
      });
      console.log(
        `✅ Обновлено: CertificationAward ${award.id} -> Award ${award.certification.awardId} (${award.certification.title})`
      );
      updatedCount++;
    } catch (error) {
      console.error(
        `❌ Ошибка обновления CertificationAward ${award.id}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  console.log(`\n🎉 Готово! Обновлено ${updatedCount} из ${awardsToFix.length} записей`);
}

main()
  .catch((error) => {
    console.error('Фатальная ошибка:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });