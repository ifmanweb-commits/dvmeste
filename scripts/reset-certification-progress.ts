/**
 * Скрипт для сброса прогресса сертификаций у всех пользователей
 * 
 * Удаляет:
 * - CertificationAward (выданные награды)
 * - Certificate (сгенерированные сертификаты)
 * - ChallengeAttempt (попытки тестов)
 * - WorkSubmission (выполненные работы)
 * - WorkReview (ревью работ)
 * - LessonCompletion (пройденные уроки)
 * - QuestionnaireSubmission (пройденные вопросники)
 * 
 * Не удаляет:
 * - Certification (сами сертификации)
 * - Challenge (испытания)
 * - Test, Work, Lesson, Questionnaire (контент испытаний)
 * - CertificateTemplate (шаблоны сертификатов)
 * - Award (типы наград)
 */

import { prisma } from '../lib/prisma';

async function main() {
  console.log('🚀 Начало сброса прогресса сертификаций...\n');

  let totalDeleted = 0;

  // 1. Удаляем ревью работ
  console.log('📋 Удаление ревью работ...');
  const deletedReviews = await prisma.workReview.deleteMany({});
  console.log(`   ✅ Удалено ревью: ${deletedReviews.count}`);
  totalDeleted += deletedReviews.count;

  // 2. Удаляем прохождения вопросников
  console.log('📝 Удаление прохождений вопросников...');
  const deletedQuestionnaireSubmissions = await prisma.questionnaireSubmission.deleteMany({});
  console.log(`   ✅ Удалено прохождений: ${deletedQuestionnaireSubmissions.count}`);
  totalDeleted += deletedQuestionnaireSubmissions.count;

  // 3. Удаляем пройденные уроки
  console.log('📚 Удаление пройденных уроков...');
  const deletedLessonCompletions = await prisma.lessonCompletion.deleteMany({});
  console.log(`   ✅ Удалено уроков: ${deletedLessonCompletions.count}`);
  totalDeleted += deletedLessonCompletions.count;

  // 4. Удаляем выполненные работы
  console.log('💼 Удаление выполненных работ...');
  const deletedWorkSubmissions = await prisma.workSubmission.deleteMany({});
  console.log(`   ✅ Удалено работ: ${deletedWorkSubmissions.count}`);
  totalDeleted += deletedWorkSubmissions.count;

  // 5. Удаляем попытки тестов
  console.log('📝 Удаление попыток тестов...');
  const deletedAttempts = await prisma.challengeAttempt.deleteMany({});
  console.log(`   ✅ Удалено попыток: ${deletedAttempts.count}`);
  totalDeleted += deletedAttempts.count;

  // 6. Удаляем сгенерированные сертификаты
  console.log('📜 Удаление сгенерированных сертификатов...');
  const deletedCertificates = await prisma.certificate.deleteMany({});
  console.log(`   ✅ Удалено сертификатов: ${deletedCertificates.count}`);
  totalDeleted += deletedCertificates.count;

  // 7. Удаляем записи о выданных наградах (CertificationAward)
  console.log('🏆 Удаление записей о выданных наградах...');
  const deletedAwards = await prisma.certificationAward.deleteMany({});
  console.log(`   ✅ Удалено наград: ${deletedAwards.count}`);
  totalDeleted += deletedAwards.count;

  console.log(`\n🎉 Готово! Всего удалено записей: ${totalDeleted}`);
  console.log('\n✅ Прогресс сертификаций всех пользователей сброшен.');
  console.log('   Сертификации, испытания и шаблоны сертификатов сохранены.');
}

main()
  .catch((error) => {
    console.error('❌ Фатальная ошибка:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });