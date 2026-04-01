import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Award, CheckCircle, Circle } from 'lucide-react';

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

  // Для каждой сертификации считаем прогресс и статусы требований
  const certificationsWithProgress = await Promise.all(
    certifications.map(async (cert) => {
      // Получаем все успешные попытки пользователя для требований этой сертификации
      const completedChallengeIds = new Set<string>();
      const requirementStatuses = new Map<string, boolean>();
      
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
        requirementStatuses.set(req.id, isCompleted);
      }

      const completedCount = completedChallengeIds.size;
      const totalCount = cert.requirements.length;
      const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
      const isCompleted = completedCount === totalCount;

      return {
        ...cert,
        completedCount,
        totalCount,
        progress,
        isCompleted,
        requirementStatuses,
      };
    })
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Сертификация</h1>
        <p className="mt-2 text-gray-600">
          Пройдите испытания и получите сертификат психолога
        </p>
      </div>

      {certificationsWithProgress.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <Award className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Сертификации пока недоступны
          </h3>
          <p className="mt-2 text-gray-500">
            Программы сертификации находятся в разработке
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {certificationsWithProgress.map((cert) => (
            <div
              key={cert.id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {cert.isCompleted ? (
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      ) : (
                        <Award className="h-8 w-8 text-blue-500" />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {cert.title}
                        </h3>
                        {cert.description && (
                          <p className="mt-1 text-sm text-gray-600">
                            {cert.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {cert.isCompleted ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Пройдено
                    </span>
                  ) : (
                    <Link
                      href={`/account/certification/${cert.slug}`}
                      className="inline-flex items-center rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]"
                    >
                      Подробнее
                    </Link>
                  )}
                </div>

                {/* Прогресс бар */}
                <div className="mt-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      Прогресс: {cert.completedCount} из {cert.totalCount}
                    </span>
                    <span className="font-medium text-gray-900">
                      {Math.round(cert.progress)}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-[#5858E2] transition-all"
                      style={{ width: `${cert.progress}%` }}
                    />
                  </div>
                </div>

                {/* Список требований */}
                <div className="mt-6 space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">
                    Требования программы:
                  </h4>
                  {cert.requirements.map((req) => {
                    const isCompleted = cert.requirementStatuses.get(req.id) ?? false;
                    
                    return (
                      <div
                        key={req.id}
                        className={`flex items-center gap-3 rounded-lg p-3 ${
                          isCompleted
                            ? 'bg-green-50'
                            : 'bg-gray-50'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400" />
                        )}
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            isCompleted ? 'text-green-900' : 'text-gray-900'
                          }`}>
                            {req.challenge.title}
                          </p>
                          <p className={`text-xs ${
                            isCompleted ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {req.challenge.type === 'TEST' ? 'Тест' : 'Квалификационная работа'}
                          </p>
                        </div>
                        {isCompleted ? (
                          <span className="text-xs font-medium text-green-700">
                            Пройдено
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">
                            Не пройдено
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}