import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import LessonsListClient from '@/components/account/LessonsListClient';
import CertificationHorNav from '@/components/account/CertificationHorNav';

export default async function CertificationLessonsPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  // Получаем все активные уроки (Challenge type=LESSON)
  const lessonChallenges = await prisma.challenge.findMany({
    where: {
      type: 'LESSON',
      isActive: true,
    },
    include: {
      lesson: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Получаем все активные сертификации для фильтра
  const certifications = await prisma.certification.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Для каждого урока получаем статус пользователя и список сертификаций
  const lessonsWithStatus = await Promise.all(
    lessonChallenges.map(async (challenge) => {
      // Проверяем, есть ли запись о просмотре (урок пройден)
      const completion = await prisma.lessonCompletion.findUnique({
        where: {
          challengeId_userId: {
            challengeId: challenge.id,
            userId: user.id,
          },
        },
      });

      // Находим все сертификации, в которых используется этот урок
      const requirements = await prisma.certificationRequirement.findMany({
        where: { challengeId: challenge.id },
        include: {
          certification: true,
        },
      });
      const certs = requirements.map(r => r.certification);

      const isCompleted = !!completion;
      const firstViewedAt = completion?.firstViewedAt;

      return {
        ...challenge,
        isCompleted,
        firstViewedAt,
        lesson: challenge.lesson ? {
          content: challenge.lesson.content,
        } : null,
        certifications: certs,
      };
    })
  );

  // Получаем баланс пользователя
  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { balance: true },
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Заголовок страницы */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Уроки
          </h1>
        </div>

        {/* Навигационная панель */}
        <CertificationHorNav activeTab="lessons" />

        {/* Список уроков */}
        <LessonsListClient
          lessons={lessonsWithStatus as any}
          certifications={certifications}
          userBalance={currentUser?.balance ?? 0}
        />
      </div>
    </div>
  );
}