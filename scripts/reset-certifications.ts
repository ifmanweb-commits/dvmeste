import { prisma } from '../lib/prisma';
import { createHash } from 'crypto';

/**
 * Скрипт для сброса сертификаций и челленджей для пользователя
 * Удаляет:
 * - Все CertificationAward (полученные сертификаты)
 * - Все ChallengeAttempt (попытки прохождения)
 * - Все ChallengeUserState (состояния пользователя)
 * 
 * Использование: npx tsx scripts/reset-certifications.ts <email>
 */

function hashEmail(email: string): string {
  return createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('Ошибка: укажите email пользователя');
    console.error('Использование: npx tsx scripts/reset-certifications.ts <email>');
    process.exit(1);
  }

  const emailHash = hashEmail(email);

  console.log(`Поиск пользователя с emailHash: ${emailHash}`);

  // Находим пользователя по emailHash
  const user = await prisma.user.findUnique({
    where: { emailHash },
    include: {
      certificationAwards: true,
      challengeAttempts: true,
      challengeStates: true,
    },
  });

  if (!user) {
    console.error(`Пользователь с email "${email}" не найден`);
    process.exit(1);
  }

  console.log(`\nНайден пользователь:`);
  console.log(`  ID: ${user.id}`);
  console.log(`  Email: ${user.email}`);
  console.log(`  fullName: ${user.fullName || 'N/A'}`);

  console.log(`\nТекущее состояние:`);
  console.log(`  CertificationAward: ${user.certificationAwards.length}`);
  console.log(`  ChallengeAttempt: ${user.challengeAttempts.length}`);
  console.log(`  ChallengeUserState: ${user.challengeStates.length}`);

  if (
    user.certificationAwards.length === 0 &&
    user.challengeAttempts.length === 0 &&
    user.challengeStates.length === 0
  ) {
    console.log('\nНет данных для удаления. Пользователь ещё не проходил испытания.');
    await prisma.$disconnect();
    return;
  }

  console.log('\nУдаление данных...');

  // Удаляем CertificationAward
  if (user.certificationAwards.length > 0) {
    await prisma.certificationAward.deleteMany({
      where: { userId: user.id },
    });
    console.log(`  ✓ Удалено CertificationAward: ${user.certificationAwards.length}`);
  }

  // Удаляем ChallengeAttempt
  if (user.challengeAttempts.length > 0) {
    await prisma.challengeAttempt.deleteMany({
      where: { userId: user.id },
    });
    console.log(`  ✓ Удалено ChallengeAttempt: ${user.challengeAttempts.length}`);
  }

  // Удаляем ChallengeUserState
  if (user.challengeStates.length > 0) {
    await prisma.challengeUserState.deleteMany({
      where: { userId: user.id },
    });
    console.log(`  ✓ Удалено ChallengeUserState: ${user.challengeStates.length}`);
  }

  console.log('\n✓ Все данные успешно удалены!');
  console.log('Теперь пользователь будет считаться как никогда не проходивший испытания.');

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Ошибка:', error);
  process.exit(1);
});