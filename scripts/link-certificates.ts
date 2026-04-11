import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Linking Certificates to CertificationAwards...');

  // Находим все CertificationAward без certificateId
  const awardsWithoutCertificate = await prisma.certificationAward.findMany({
    where: {
      certificateId: null,
    },
    include: {
      certification: true,
      user: true,
    },
  });

  console.log(`Found ${awardsWithoutCertificate.length} awards without certificateId`);

  for (const award of awardsWithoutCertificate) {
    // Ищем сертификат для этого пользователя и шаблона сертификации
    const templateId = award.certification?.certificateTemplateId;
    const certificate = await prisma.certificate.findFirst({
      where: {
        userId: award.userId,
        templateId: templateId || undefined,
      },
    });

    if (certificate) {
      console.log(`\nLinking award ${award.id} to certificate ${certificate.id}`);
      await prisma.certificationAward.update({
        where: { id: award.id },
        data: { certificateId: certificate.id },
      });
      console.log(`  Certificate verificationCode: ${certificate.verificationCode}`);
      console.log(`  Certificate imageUrl: ${certificate.imageUrl}`);
    } else {
      console.log(`\nNo certificate found for award ${award.id}`);
      console.log(`  userId: ${award.userId}`);
      console.log(`  templateId: ${templateId || 'NULL'}`);
    }
  }

  // Проверка для пользователя smirnov после обновления
  const smirnov = await prisma.user.findFirst({
    where: { slug: 'smirnov' },
  });

  if (smirnov) {
    console.log(`\n=== User smirnov (ID: ${smirnov.id}) after update ===`);
    
    const smirnovAwards = await prisma.certificationAward.findMany({
      where: { userId: smirnov.id },
      include: { certificate: true, certification: true },
    });

    console.log(`Found ${smirnovAwards.length} awards for smirnov`);
    for (const award of smirnovAwards) {
      console.log(`  Award ID: ${award.id}`);
      console.log(`    certificationId: ${award.certificationId}`);
      console.log(`    certificateId: ${award.certificateId}`);
      console.log(`    Certificate verificationCode: ${award.certificate?.verificationCode || 'NULL'}`);
      console.log(`    Certificate imageUrl: ${award.certificate?.imageUrl || 'NULL'}`);
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});