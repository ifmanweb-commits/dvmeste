/**
 * Тестовый скрипт для генерации сертификата
 * 
 * Использование: npx tsx scripts/test-certificate-generation.ts
 * 
 * Параметры задаются в начале скрипта:
 * - userId: ID пользователя, которому выдаётся сертификат
 * - certificationId: ID сертификации, за которую выдаётся сертификат
 */

import { prisma } from '../lib/prisma';
import { generateAndSaveCertificate } from '../lib/actions/certificate-templates';

// ==================== ПАРАМЕТРЫ ====================
const USER_ID = 'cmmc5ye6i0003rg34vunncxb2';
const CERTIFICATION_ID = 'cmng2opc20000rg4cjmwibc3c';
// ===================================================

async function main() {
  console.log('=== Тест генерации сертификата ===\n');
  console.log(`User ID: ${USER_ID}`);
  console.log(`Certification ID: ${CERTIFICATION_ID}\n`);

  // 1. Проверяем пользователя
  console.log('1. Проверяем пользователя...');
  const user = await prisma.user.findUnique({
    where: { id: USER_ID },
    select: {
      id: true,
      email: true,
      fullName: true,
      isPublished: true,
    },
  });

  if (!user) {
    console.error(`❌ Пользователь с ID ${USER_ID} не найден`);
    process.exit(1);
  }
  console.log(`✓ Пользователь найден: ${user.fullName || user.email}`);

  // 2. Проверяем сертификацию
  console.log('\n2. Проверяем сертификацию...');
  const certification = await prisma.certification.findUnique({
    where: { id: CERTIFICATION_ID },
    include: {
      certificateTemplate: true,
    },
  });

  if (!certification) {
    console.error(`❌ Сертификация с ID ${CERTIFICATION_ID} не найдена`);
    process.exit(1);
  }
  console.log(`✓ Сертификация найдена: ${certification.title}`);
  console.log(`  - rewardType: ${certification.rewardType}`);
  console.log(`  - certificateTemplateId: ${certification.certificateTemplateId}`);

  if (!certification.certificateTemplate) {
    console.error('❌ У сертификации не настроен шаблон сертификата');
    console.log('   Проверьте настройки сертификации в админ-панели');
    process.exit(1);
  }
  console.log(`  - Шаблон: ${certification.certificateTemplate.name} (${certification.certificateTemplate.slug})`);

  // 3. Проверяем, не выдан ли уже сертификат
  console.log('\n3. Проверяем существующие сертификаты...');
  const existingCertificate = await prisma.certificate.findFirst({
    where: {
      userId: USER_ID,
      templateId: certification.certificateTemplateId!,
    },
  });

  if (existingCertificate) {
    console.log(`⚠ У пользователя уже есть сертификат:`);
    console.log(`  - ID: ${existingCertificate.id}`);
    console.log(`  - verificationCode: ${existingCertificate.verificationCode}`);
    console.log(`  - issuedAt: ${existingCertificate.issuedAt.toISOString()}`);
    console.log(`  - imageUrl: ${existingCertificate.imageUrl}`);
  }

  // 4. Проверяем награду
  console.log('\n4. Проверяем награду...');
  const existingAward = await prisma.certificationAward.findFirst({
    where: {
      certificationId: CERTIFICATION_ID,
      userId: USER_ID,
    },
  });

  if (existingAward) {
    console.log(`✓ Награда уже выдана: ${existingAward.awardedAt.toISOString()}`);
  } else {
    console.log('⚠ Награда ещё не выдана (будет создана при генерации)');
  }

  // 5. Генерируем сертификат
  console.log('\n5. Генерируем сертификат...');
  
  // Создаём награду если её нет
  let awardId: string;
  if (!existingAward) {
    const award = await prisma.certificationAward.create({
      data: {
        certificationId: CERTIFICATION_ID,
        userId: USER_ID,
      },
    });
    awardId = award.id;
    console.log(`✓ Награда создана: ${awardId}`);
  } else {
    awardId = existingAward.id;
  }

  try {
    const result = await generateAndSaveCertificate(
      certification.certificateTemplateId!,
      USER_ID,
      {},
      {
        certification: {
          title: certification.title,
          awardText: (certification as any).awardText || certification.title,
          level: certification.level,
        },
        award: {
          id: awardId,
          issuedAt: new Date().toISOString(),
        },
      }
    );

    if (result.success && result.certificate) {
      console.log('\n✅ Сертификат успешно сгенерирован!');
      console.log(`  - ID: ${result.certificate.id}`);
      console.log(`  - verificationCode: ${result.certificate.verificationCode}`);
      console.log(`  - imageUrl: ${result.certificate.imageUrl}`);
      console.log(`  - issuedAt: ${result.certificate.issuedAt.toISOString()}`);
      console.log('\n📋 Для проверки используйте:');
      console.log(`   https://dvmeste.ru/certificates/verify?code=${result.certificate.verificationCode}`);
    } else {
      console.error('❌ Ошибка генерации:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Исключение при генерации:', error);
    process.exit(1);
  }

  await prisma.$disconnect();
  console.log('\n=== Готово ===');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});