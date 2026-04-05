import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Award, CheckCircle, BookOpen, FileText } from 'lucide-react';
import Image from 'next/image';

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
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Разделяем на полученные и доступные
  const awardedCertifications = certifications.filter(cert => cert.awards.length > 0);
  const availableCertifications = certifications.filter(cert => cert.awards.length === 0);

  // Для доступных сертификаций считаем прогресс
  const availableCertsWithProgress = await Promise.all(
    availableCertifications.map(async (cert) => {
      const completedChallengeIds = new Set<string>();
      const requirementsWithStatus = [];
      
      for (const req of cert.requirements) {
        const successfulAttempt = await prisma.challengeAttempt.findFirst({
          where: {
            userId: user.id,
            challengeId: req.challengeId,
            passed: true,
          },
        });
        
        const isCompleted = !!successfulAttempt;
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
        <nav className="mb-8 border-b border-gray-200">
          <ul className="flex gap-6">
            <li>
              <Link
                href="/account/certification"
                className="inline-flex items-center gap-2 border-b-2 border-[#5858E2] pb-3 text-sm font-medium text-[#5858E2]"
              >
                <Award className="h-4 w-4" />
                Сертификации
              </Link>
            </li>
            <li>
              <Link
                href="/account/certification/tests"
                className="inline-flex items-center gap-2 border-b-2 border-transparent pb-3 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <BookOpen className="h-4 w-4" />
                Тесты
              </Link>
            </li>
            <li>
              <Link
                href="/account/certification/works"
                className="inline-flex items-center gap-2 border-b-2 border-transparent pb-3 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <FileText className="h-4 w-4" />
                Работы
              </Link>
            </li>
          </ul>
        </nav>

        {/* РАЗДЕЛ 1 — Полученные сертификаты */}
        {awardedCertifications.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Полученные сертификаты
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {awardedCertifications.map((cert) => {
                const awardedYear = new Date(cert.awards[0].awardedAt).getFullYear();
                
                return (
                  <Link
                    key={cert.id}
                    href={`/account/certification/${cert.id}`}
                    className="group relative overflow-hidden rounded-2xl border-2 border-[#5858E2]/20 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-[#5858E2]/40"
                  >
                    {/* Бейдж с иконкой */}
                    <div className="mb-2 flex justify-center">
                      <div className="transition-transform group-hover:scale-105">
                        <Image
                          src="/images/icons/award-gold-500-tp.png"
                          alt="Сертификат получен"
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
                    
                    {/* Название сертификата */}
                    <h3 className="text-center text-base font-semibold text-gray-900 group-hover:text-[#5858E2]">
                      {cert.title}
                    </h3>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* РАЗДЕЛ 2 — Доступные сертификаты */}
        {availableCertsWithProgress.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Доступные сертификаты
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
                    <h3 className="text-lg font-semibold text-gray-900">
                      {cert.title}
                    </h3>
                    {cert.description && (
                      <p className="mt-2 text-sm text-gray-600">
                        {cert.description}
                      </p>
                    )}
                  </div>
                  
                    {/* КОЛОНКА 3 — Список испытаний */}
                  <div className="sm:col-span-7">
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
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Пустое состояние */}
        {awardedCertifications.length === 0 && availableCertsWithProgress.length === 0 && (
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