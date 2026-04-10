import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { Award, CheckCircle, Clock, BookOpen, FileText, FileBadge } from 'lucide-react';
import Image from 'next/image';
import CertificationHorNav from '@/components/account/CertificationHorNav';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CertificationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  // Получаем сертификацию по id
  const certification = await prisma.certification.findUnique({
    where: { id, isActive: true },
    include: {
      requirements: {
        include: {
          challenge: {
            include: {
              test: true,
              work: true,
            },
          },
        },
        orderBy: { order: 'asc' },
      },
      awards: {
        where: { userId: user.id },
      },
      certificateTemplate: true,
    },
  });

  // Получаем сгенерированные сертификаты пользователя
  const userCertificates = await prisma.certificate.findMany({
    where: { userId: user.id },
    include: {
      template: true,
    },
  });

  if (!certification) {
    notFound();
  }

  // Проверяем, получена ли уже эта сертификация
  const isCertified = certification.awards.length > 0;
  const awardedYear = isCertified ? new Date(certification.awards[0].awardedAt).getFullYear() : null;

  // Для каждого требования получаем статус
  const requirementsWithStatus = await Promise.all(
    certification.requirements.map(async (req) => {
      let isCompleted = false;
      
      // Для TEST проверяем challengeAttempt, для WORK - workSubmission, для LESSON - lessonCompletion
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
        // Для урока проверяем, есть ли запись о просмотре
        const lessonCompletion = await prisma.lessonCompletion.findUnique({
          where: {
            challengeId_userId: {
              challengeId: req.challengeId,
              userId: user.id,
            },
          },
        });
        isCompleted = !!lessonCompletion;
      }

      return {
        ...req,
        isCompleted,
        challenge: {
          ...req.challenge,
          test: req.challenge.test ? {
            questionsCount: req.challenge.test.questionsCount,
            passingScore: req.challenge.test.passingScore,
            timeLimit: req.challenge.test.timeLimit,
          } : null,
          work: req.challenge.work ? {
            instructions: req.challenge.work.instructions,
            requiredReviews: req.challenge.work.requiredReviews,
            reviewsToPass: req.challenge.work.reviewsToPass,
          } : null,
        },
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

        {/* Заголовок сертификации и награда */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Левая колонка - Информация */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">
                {certification.title}
              </h2>
              
              {certification.description && (
                <p className="mt-3 text-gray-600">
                  {certification.description}
                </p>
              )}

              {/* Плашка с детализацией */}
              <div className="mt-6 rounded-xl bg-gray-50 p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#5858E2]/10">
                    <Award className="h-6 w-6 text-[#5858E2]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {certification.requirements.length} испытаний в программе
                    </p>
                    {isCertified && (
                      <p className="text-sm text-green-600">
                        Получена в {awardedYear} году
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Правая колонка - Награда */}
          <div className="lg:col-span-1">
            <div className="flex h-full items-center justify-center rounded-2xl border-2 border-[#5858E2]/20 bg-white p-6 shadow-sm">
              <div className="text-center">
                <div className="relative inline-block">
                  {(() => {
                    // Определяем изображение для отображения
                    let imageUrl = '/images/icons/award-gold-500-tp.png';
                    let imageAlt = isCertified ? "Сертификат получен" : "Сертификат ещё не получен";
                    let certificateUrl: string | null = null;
                    
                    if (isCertified) {
                      if (certification.rewardType === 'badge' && certification.badgeUrl) {
                        // Для ачивки используем badgeUrl
                        imageUrl = certification.badgeUrl;
                        imageAlt = `Ачивка: ${certification.title}`;
                      } else if (certification.rewardType === 'certificate' && certification.certificateTemplateId) {
                        // Для сертификата ищем сгенерированный сертификат
                        const generatedCert = userCertificates.find(
                          (gc) => gc.templateId === certification.certificateTemplateId
                        );
                        if (generatedCert && generatedCert.imageUrl) {
                          imageUrl = generatedCert.imageUrl;
                          imageAlt = `Сертификат: ${certification.title}`;
                          certificateUrl = generatedCert.imageUrl;
                        }
                      }
                    }
                    
                    return (
                      <>
                        <Image
                          src={imageUrl}
                          alt={imageAlt}
                          width={0}
                          height={0}
                          sizes="100vw"
                          className={`mx-auto h-auto w-full object-contain ${
                            !isCertified ? 'opacity-20 grayscale' : ''
                          }`}
                        />
                        {isCertified && certificateUrl && (
                          <div className="mt-4">
                            <a
                              href={certificateUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white hover:bg-[#4a4ac9]"
                            >
                              Скачать сертификат
                            </a>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
                {isCertified && certification.rewardType === 'badge' && (
                  <p className="mt-4 text-lg font-semibold text-gray-900">
                    Награда получена!
                  </p>
                )}
                {!isCertified && (
                  <>
                    <p className="mt-4 text-lg font-semibold text-gray-400">
                      Сертификат ещё не получен
                    </p>
                    <p className="mt-1 text-sm text-gray-400">
                      Пройдите все испытания
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Список испытаний */}
        <section>
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Программа сертификации
          </h3>
          <div className="space-y-4">
            {requirementsWithStatus.map((req, index) => (
              <div
                key={req.id}
                className={`rounded-2xl border p-6 shadow-sm transition-shadow hover:shadow-md ${
                  req.isCompleted
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Номер и статус */}
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${
                        req.isCompleted
                          ? 'bg-green-200 text-green-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {index + 1}
                    </div>
                    {req.isCompleted && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                  </div>

                  {/* Контент */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {req.challenge.title}
                      </h4>
                       {req.challenge.type === 'TEST' ? (
                         <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                           <BookOpen className="mr-1 h-3 w-3" />
                           Тест
                         </span>
                       ) : req.challenge.type === 'LESSON' ? (
                         <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                           <FileText className="mr-1 h-3 w-3" />
                           Урок
                         </span>
                       ) : (
                         <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                           <FileBadge className="mr-1 h-3 w-3" />
                           Работа
                         </span>
                       )}
                      {req.isCompleted && (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Пройдено
                        </span>
                      )}
                    </div>

                    {/* Описание испытания */}
                    {req.challenge.description && (
                      <p className="mt-2 text-sm text-gray-600">
                        {req.challenge.description}
                      </p>
                    )}

                    {/* Детали испытания */}
                    <div className="mt-4 flex flex-wrap gap-4">
                      {req.challenge.type === 'TEST' && req.challenge.test && (
                        <>
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>{req.challenge.test.timeLimit || 30} мин</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <span>Вопросов: {req.challenge.test.questionsCount}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <span>Нужно верных ответов: {req.challenge.test.passingScore}</span>
                          </div>
                        </>
                      )}
                      {req.challenge.type === 'WORK' && req.challenge.work && (
                        <>
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <span>Проверок: {req.challenge.work.requiredReviews}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <span>Нужно для сдачи: {req.challenge.work.reviewsToPass}</span>
                          </div>
                        </>
                      )}
                      {req.challenge.type === 'LESSON' && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <span>Просмотрите материал урока</span>
                        </div>
                      )}
                    </div>

                    {/* Ссылка на прохождение */}
                        {!req.isCompleted && (
                          <div className="mt-4">
                            {req.challenge.type === 'TEST' ? (
                              <Link
                                href={`/account/certification/tests`}
                                className="inline-flex items-center text-sm font-medium text-[#5858E2] transition-colors hover:text-[#4a4ac9]"
                              >
                                Пройти тест →
                              </Link>
                            ) : req.challenge.type === 'LESSON' ? (
                              <Link
                                href={`/account/certification/lessons`}
                                className="inline-flex items-center text-sm font-medium text-[#5858E2] transition-colors hover:text-[#4a4ac9]"
                              >
                                Открыть урок →
                              </Link>
                            ) : (
                              <Link
                                href={`/account/certification/works`}
                                className="inline-flex items-center text-sm font-medium text-[#5858E2] transition-colors hover:text-[#4a4ac9]"
                              >
                                Выполнить работу →
                              </Link>
                            )}
                          </div>
                        )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}