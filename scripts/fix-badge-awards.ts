import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fixing Badge Awards...');

  // Находим все CertificationAward для сертификаций с rewardType: badge
  const badgeAwards = await prisma.certificationAward.findMany({
    where: {
      certificate: {
        isNot: null,
      },
    },
    include: {
      certification: true,
      certificate: true,
    },
  });

  console.log(`Found ${badgeAwards.length} awards with certificates`);

  for (const award of badgeAwards) {
    if (award.certification?.rewardType === 'badge') {
      console.log(`\nUnlinking certificate from award ${award.id} (Certification: ${award.certification.title})`);
      await prisma.certificationAward.update({
        where: { id: award.id },
        data: { certificateId: null },
      });
    }
  }

  // Проверка для пользователя smirnov после обновления
  const smirnov = await prisma.user.findFirst({
    where: { slug: 'smirnov' },
  });

  if (smirnov) {
    console.log(`\n=== User smirnov (ID: ${smirnov.id}) after fix ===`);
    
    const smirnovAwards = await prisma.certificationAward.findMany({
      where: { userId: smirnov.id },
      include: { certification: true, certificate: true },
    });

    console.log(`Found ${smirnovAwards.length} awards for smirnov`);
    for (const award of smirnovAwards) {
      console.log(`  Award ID: ${award.id}`);
      console.log(`    Certification: ${award.certification?.title}`);
      console.log(`    rewardType: ${award.certification?.rewardType}`);
      console.log(`    badgeUrl: ${award.certification?.badgeUrl || 'NULL'}`);
      console.log(`    certificateId: ${award.certificateId}`);
      console.log(`    Certificate verificationCode: ${award.certificate?.verificationCode || 'NULL'}`);
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});