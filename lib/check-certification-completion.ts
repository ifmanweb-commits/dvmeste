import { prisma } from '@/lib/prisma';

/**
 * Проверяет, завершена ли сертификация после прохождения испытания.
 * Если все требования сертификации выполнены — выдаёт награду.
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
    },
  });

  for (const cert of certifications) {
    // Проверяем, есть ли текущее испытание в требованиях этой сертификации
    const hasCurrentChallenge = cert.requirements.some(
      (req) => req.challengeId === challengeId
    );

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
        // Выдаём награду
        await prisma.certificationAward.create({
          data: {
            certificationId: cert.id,
            userId,
          },
        });

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