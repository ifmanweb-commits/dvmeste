import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking Certifications...');

  // Все сертификации
  const certifications = await prisma.certification.findMany({
    include: {
      certificateTemplate: true,
    },
  });

  console.log('\n=== All Certifications ===');
  for (const cert of certifications) {
    console.log(`ID: ${cert.id}`);
    console.log(`  Title: ${cert.title}`);
    console.log(`  rewardType: ${cert.rewardType}`);
    console.log(`  badgeUrl: ${cert.badgeUrl || 'NULL'}`);
    console.log(`  certificateTemplateId: ${cert.certificateTemplateId || 'NULL'}`);
    console.log(`  isPublic: ${cert.isPublic}`);
    console.log('---');
  }

  // Проверка для пользователя smirnov
  const smirnov = await prisma.user.findFirst({
    where: { slug: 'smirnov' },
  });

  if (smirnov) {
    console.log(`\n=== User smirnov (ID: ${smirnov.id}) ===`);
    
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