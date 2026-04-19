import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Award, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import CertificationHorNav from '@/components/account/CertificationHorNav';

export default async function CertificationPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  // Получаем все активные сертификации
  const certifications = await prisma.certification.findMany({
    where: { isActive: true },
    include: {
      requirements: {
        include: {
          challenge: true,
        },
        orderBy: { order: 'asc' },
      },
      awards: {
        where: { userId: user.id },
        include: {
          award: true,
        },
      },
      certificateTemplate: true,
      award: {
        select: {
          id: true,
          type: true,
          badgeUrl: true,
          isPublic: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Получаем все награды пользователя (включая награды без привязки к сертификации)
  const allUserAwards = await prisma.certificationAward.findMany({
    where: { userId: user.id },
    include: {
      award: true,
      certification: true,
    },
    orderBy: { awardedAt: 'desc' },
  });

  // Получаем сгенерированные сертификаты пользователя
  const userCertificates = await prisma.certificate.findMany({
    where: { userId: user.id },
    include: {
      template: true,
    },
  });

  // Формируем список всех наград для отображения
  const allRewards = allUserAwards.map(awardRecord => {
    // Если есть certification - используем его данные
    if (awardRecord.certification) {
      const cert = certifications.find(c => c.id === awardRecord.certification?.id);
      return {
        id: awardRecord.id,
        title: awardRecord.certification.title,
        description: awardRecord.certification.description,
        awardedAt: awardRecord.awardedAt,
        certificationId: awardRecord.certification.id,
        badgeUrl: awardRecord.award?.badgeUrl || null,
        rewardType: awardRecord.award?.type || 'CERTIFICATE',
        hasCertification: !!cert,
      };
    }
    // Если нет certification - это награда без привязки (например, выданная через ключ)
    return {
      id: awardRecord.id,
      title: awardRecord.award?.name || 'Награда',
      description: null,
      awardedAt: awardRecord.awardedAt,
      certificationId: null,
      badgeUrl: awardRecord.award?.badgeUrl || null,
      rewardType: awardRecord.award?.type || 'CERTIFICATE',
      hasCertification: false,
    };
  });

  // Для доступных сертификаций (без наград) считаем прогресс
  const availableCertsWithProgress = await Promise.all(
    certifications
      .filter(cert => !allUserAwards.some(award => award.certificationId === cert.id))
      .map(async (cert) => {
        const completedChallengeIds = new Set<string>();
        const requirementsWithStatus = [];
        
        for (const req of cert.requirements) {
          let isCompleted = false;
          
          if (req.challenge.type === 'TEST') {
            const successfulAttempt = await prisma.challengeAttempt.findFirst({
              where: {
                userId: user.id,
                challengeId: req.challengeId,
                passed: true,
              },
            });
            isCompleted = !!successfulAttempt;
          } else if (req.challenge.type === 'WORK') {
            const approvedSubmission = await prisma.workSubmission.findFirst({
              where: {
                userId: user.id,
                challengeId: req.challengeId,
                status: 'APPROVED',
              },
            });
            isCompleted = !!approvedSubmission;
          } else if (req.challenge.type === 'LESSON') {
            const lessonCompletion = await prisma.lessonCompletion.findUnique({
              where: {
                challengeId_userId: {
                  challengeId: req.challengeId,
                  userId: user.id,
                },
              },
            });
            isCompleted = !!lessonCompletion;
          } else if (req.challenge.type === 'QUESTIONNAIRE') {
            const approvedSubmission = await prisma.questionnaireSubmission.findFirst({
              where: {
                userId: user.id,
                challengeId: req.challengeId,
                status: 'APPROVED',
              },
            });
            isCompleted = !!approvedSubmission;
          }
          
          if (isCompleted) {
            completedChallengeIds.add(req.challengeId);
          }
          
          requirementsWithStatus.push({
            ...req,
            isCompleted,
          });
        }

        const completedCount = completedChallengeIds.size;
        const totalCount = cert.requirements.length;
        const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

        return {
          ...cert,
          completedCount,
          totalCount,
          progress,
          requirementsWithStatus,
        };
      })
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Заголовок страницы */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Сертификация
          </h1>
        </div>

        {/* Навигационная панель */}
        <CertificationHorNav activeTab="certifications" />

        {/* РАЗДЕЛ 1 — Все полученные награды */}
        {allRewards.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Полученные награды
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {allRewards.map((reward) => {
                const awardedYear = new Date(reward.awardedAt).getFullYear();
                
                // Определяем изображение для отображения
                let imageUrl = '/images/icons/award-gold-500-tp.png';
                let imageAlt = 'Награда получена';
                let linkHref = reward.certificationId ? `/account/certification/${reward.certificationId}` : '#';
                
                if (reward.rewardType === 'BADGE' && reward.badgeUrl) {
                  // Для ачивки используем badgeUrl
                  imageUrl = reward.badgeUrl;
                  imageAlt = `Ачивка: ${reward.title}`;
                } else if (reward.rewardType === 'CERTIFICATE' && reward.certificationId) {
                  // Для сертификата ищем сгенерированный сертификат
                  const cert = certifications.find(c => c.id === reward.certificationId);
                  if (cert?.certificateTemplateId) {
                    const generatedCert = userCertificates.find(
                      (gc) => gc.templateId === cert.certificateTemplateId
                    );
                    if (generatedCert && generatedCert.imageUrl) {
                      imageUrl = generatedCert.imageUrl;
                      imageAlt = `Сертификат: ${reward.title}`;
                    }
                  }
                }
                
                return (
                  <Link
                    key={reward.id}
                    href={linkHref}
                    className="group relative overflow-hidden rounded-2xl border-2 border-[#5858E2]/20 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-[#5858E2]/40"
                  >
                    {/* Бейдж с иконкой */}
                    <div className="mb-2 flex justify-center">
                      <div className="transition-transform group-hover:scale-105">
                        <Image
                          src={imageUrl}
                          alt={imageAlt}
                          width={200}
                          height={200}
                          className="h-56 w-56 object-contain"
                        />
                      </div>
                    </div>
                    
                    {/* Год */}
                    <p className="mb-1 text-center text-sm font-medium text-gray-500">
                      {awardedYear}
                    </p>
                    
                    {/* Название награды */}
                    <h3 className="text-center text-base font-semibold text-gray-900 group-hover:text-[#5858E2]">
                      {reward.title}
                    </h3>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* РАЗДЕЛ 2 — Доступные сертификации */}
        {availableCertsWithProgress.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Доступные сертификации
            </h2>
            <div className="space-y-4">
              {availableCertsWithProgress.map((cert) => (
                <div
                  key={cert.id}
                  className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:grid-cols-12 sm:gap-6"
                >
                  {/* КОЛОНКА 1 — Иконка */}
                  <div className="flex items-start justify-center sm:col-span-1">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-[#5858E2]/10 to-[#4a4ac9]/10">
                      <Award className="h-8 w-8 text-[#5858E2]" />
                    </div>
                  </div>
                  
                  {/* КОЛОНКА 2 — Название и описание */}
                  <div className="sm:col-span-4">
                    <Link
                      href={`/account/certification/${cert.id}`}
                      className="text-lg font-semibold text-gray-900 hover:text-[#5858E2] hover:underline"
                    >
                      {cert.title}
                    </Link>
                    {cert.description && (
                      <p className="mt-2 text-sm text-gray-600">
                        {cert.description}
                      </p>
                    )}
                  </div>
                  
                    {/* КОЛОНКА 3 — Список испытаний */}
                  <div className="sm:col-span-5">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Испытания
                    </h4>
                    <ul className="space-y-2">
                      {cert.requirementsWithStatus.map((req) => (
                        <li
                          key={req.id}
                          className={`flex items-center gap-2 text-sm ${
                            req.isCompleted ? 'text-green-600' : 'text-gray-900'
                          }`}
                        >
                          {req.isCompleted ? (
                            <CheckCircle className="h-4 w-4 flex-shrink-0" />
                          ) : (
                            <span className="h-4 w-4 flex-shrink-0 rounded-full border-2 border-gray-300" />
                          )}
                          {req.challenge.type === 'TEST' ? (
                            <Link
                              href={`/account/certification/tests?certification=${cert.id}`}
                              className={`hover:text-[#5858E2] hover:underline ${
                                req.isCompleted ? 'font-medium' : ''
                              }`}
                            >
                              {req.challenge.title}
                            </Link>
                          ) : req.challenge.type === 'LESSON' ? (
                            <Link
                              href={`/account/certification/lessons?certification=${cert.id}`}
                              className={`hover:text-[#5858E2] hover:underline ${
                                req.isCompleted ? 'font-medium' : ''
                              }`}
                            >
                              {req.challenge.title}
                            </Link>
                          ) : req.challenge.type === 'QUESTIONNAIRE' ? (
                            <Link
                              href={`/account/certification/questionnaires?certification=${cert.id}`}
                              className={`hover:text-[#5858E2] hover:underline ${
                                req.isCompleted ? 'font-medium' : ''
                              }`}
                            >
                              {req.challenge.title}
                            </Link>
                          ) : (
                            <Link
                              href={`/account/certification/works?certification=${cert.id}`}
                              className={`hover:text-[#5858E2] hover:underline ${
                                req.isCompleted ? 'font-medium' : ''
                              }`}
                            >
                              {req.challenge.title}
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* КОЛОНКА 4 — Прогресс */}
                  <div className="flex flex-col justify-center sm:col-span-2">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">Прогресс</span>
                      <span className="font-semibold text-[#5858E2]">{Math.round(cert.progress)}%</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-gray-200">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          cert.progress === 100 ? 'bg-green-500' : 'bg-[#5858E2]'
                        }`}
                        style={{ width: `${cert.progress}%` }}
                      />
                    </div>
                    <p className="mt-2 text-center text-xs text-gray-500">
                      {cert.completedCount} из {cert.totalCount} пройдено
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Пустое состояние */}
        {allRewards.length === 0 && availableCertsWithProgress.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
            <Award className="mx-auto h-14 w-14 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Сертификации пока недоступны
            </h3>
            <p className="mt-2 text-gray-500">
              Программы сертификации находятся в разработке
            </p>
          </div>
        )}
      </div>
    </div>
  );
}