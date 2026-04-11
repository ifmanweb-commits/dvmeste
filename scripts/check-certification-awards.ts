import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking CertificationAwards...');

  const awards = await prisma.certificationAward.findMany({
    include: {
      certificate: true,
      certification: true,
      user: true,
    },
    take: 20,
  });

  console.log('\n=== CertificationAwards ===');
  for (const award of awards) {
    console.log(`ID: ${award.id}`);
    console.log(`  userId: ${award.userId}`);
    console.log(`  certificationId: ${award.certificationId}`);
    console.log(`  certificateId: ${award.certificateId}`);
    console.log(`  awardedAt: ${award.awardedAt}`);
    console.log(`  Certificate verificationCode: ${award.certificate?.verificationCode || 'NULL'}`);
    console.log(`  Certificate imageUrl: ${award.certificate?.imageUrl || 'NULL'}`);
    console.log(`  Certification title: ${award.certification?.title || 'NULL'}`);
    console.log(`  User email: ${award.user?.email || 'NULL'}`);
    console.log('---');
  }

  // Проверка для пользователя smirnov
  const smirnov = await prisma.user.findFirst({
    where: {
      slug: 'smirnov',
    },
  });

  if (smirnov) {
    console.log(`\n=== User smirnov (ID: ${smirnov.id}) ===`);
    
    const smirnovAwards = await prisma.certificationAward.findMany({
      where: {
        userId: smirnov.id,
      },
      include: {
        certificate: true,
        certification: true,
      },
    });

    console.log(`Found ${smirnovAwards.length} awards for smirnov`);
    for (const award of smirnovAwards) {
      console.log(`  Award ID: ${award.id}`);
      console.log(`    certificationId: ${award.certificationId}`);
      console.log(`    certificateId: ${award.certificateId}`);
      console.log(`    Certificate verificationCode: ${award.certificate?.verificationCode || 'NULL'}`);
      console.log(`    Certificate imageUrl: ${award.certificate?.imageUrl || 'NULL'}`);
    }
  } else {
    console.log('\nUser smirnov not found');
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});