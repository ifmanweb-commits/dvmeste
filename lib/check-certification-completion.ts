import { prisma } from '@/lib/prisma';
import { generateAndSaveCertificate } from './actions/certificate-templates';
import { sendNotification } from '@/lib/notifications';
import { NotificationType } from '@prisma/client';

/**
 * Проверяет, завершена ли сертификация после прохождения испытания.
 * Если все требования сертификации выполнены — выдаёт награду.
 * Если у сертификации есть awardId — берём данные из Award, иначе из Certification.
 * 
 * @param userId - ID пользователя
 * @param challengeId - ID пройденного испытания
 */
export async function checkCertificationCompletion(
  userId: string,
  challengeId: string
): Promise<void> {
  // Находим все активные сертификации, где есть это испытание
  const certifications = await prisma.certification.findMany({
    where: { isActive: true },
    include: {
      requirements: true,
      award: true, // Добавляем связь с Award
    },
  });

  for (const cert of certifications) {
    // Проверяем, есть ли текущее испытание в требованиях сертификации
    const hasCurrentChallenge = cert.requirements.some(
      (req) => req.challengeId === challengeId
    );

    // Берём awardText из Award если есть, иначе из Certification
    let awardText = cert.award?.awardText || cert.awardText || cert.title;
    let certificateTemplateId = cert.award?.certificateTemplateId || cert.certificateTemplateId;
    let rewardType = cert.award?.type || (cert as any).rewardType;

    // Если этого испытания нет в требованиях — пропускаем
    if (!hasCurrentChallenge) {
      continue;
    }

    // Проверяем, все ли требования выполнены
    const allRequirementsCompleted = await Promise.all(
      cert.requirements.map(async (req) => {
        // Для каждого требования проверяем, есть ли успешное прохождение
        const successfulAttempt = await prisma.challengeAttempt.findFirst({
          where: {
            userId,
            challengeId: req.challengeId,
            passed: true,
          },
        });

        if (successfulAttempt) {
          return true;
        }

        // Для вопросников проверяем QuestionnaireSubmission
        const questionnaireSubmission = await prisma.questionnaireSubmission.findFirst({
          where: {
            userId,
            challengeId: req.challengeId,
            status: 'APPROVED',
          },
        });

        if (questionnaireSubmission) {
          return true;
        }

        // Для квалификационных работ проверяем WorkSubmission
        const workSubmission = await prisma.workSubmission.findFirst({
          where: {
            userId,
            challengeId: req.challengeId,
            status: 'APPROVED',
          },
        });

        if (workSubmission) {
          return true;
        }

        // Для уроков проверяем LessonCompletion
        const lessonCompletion = await prisma.lessonCompletion.findUnique({
          where: {
            challengeId_userId: {
              challengeId: req.challengeId,
              userId,
            },
          },
        });

        if (lessonCompletion) {
          return true;
        }

        return false;
      })
    );

    const allCompleted = allRequirementsCompleted.every((r) => r);

    if (allCompleted) {
      // Проверяем, не выдана ли уже награда
      const existingAward = await prisma.certificationAward.findFirst({
        where: {
          certificationId: cert.id,
          userId,
        },
      });

      if (!existingAward) {
        // Выдаём награду с ссылкой на Award если есть
        const award = await prisma.certificationAward.create({
          data: {
            certificationId: cert.id,
            userId,
            awardId: cert.awardId || undefined,
          },
        });

        // Отправляем уведомление пользователю о завершении сертификации
        await sendNotification(userId, {
          type: NotificationType.CERTIFICATION_PASSED,
          title: 'Сертификация пройдена!',
          message: `Поздравляем! Вы успешно завершили сертификацию "${cert.title}".${cert.award?.type === 'CERTIFICATE' ? ' Сертификат доступен в вашем кабинете.' : ''}`,
          linkUrl: '/account/certification',
          linkText: 'Перейти к сертификации',
          metadata: {
            certificationId: cert.id,
            certificationTitle: cert.title,
            awardId: award.id,
          },
        });

        // Проверяем тип награды и генерируем сертификат если нужно
        // Берём certificateTemplateId из Award если есть
        const templateId = certificateTemplateId;
        if (rewardType === 'CERTIFICATE' && templateId) {
          try {
            await generateAndSaveCertificate(
              templateId,
              userId,
              {},
              {
                certification: {
                  title: cert.title,
                  awardText: awardText,
                  level: cert.level,
                },
                award: {
                  id: award.id,
                  issuedAt: new Date().toISOString(),
                },
              }
            );
          } catch (error) {
            console.error('Ошибка генерации сертификата:', error);
            // Не прерываем процесс, награда уже выдана
          }
        }

        // Обновляем уровень сертификации пользователя
        // Если level не null и больше текущего — присваиваем, иначе не меняем
        if (cert.level !== null && cert.level > 0) {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { certificationLevel: true },
          });

          if (user && cert.level > user.certificationLevel) {
            await prisma.user.update({
              where: { id: userId },
              data: { certificationLevel: cert.level },
            });
          }
        }
      }
    }
  }
}
