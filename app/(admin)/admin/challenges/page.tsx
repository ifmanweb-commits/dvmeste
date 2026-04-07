import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import DeleteChallengeButton from './DeleteChallengeButton';
import ChallengesFilters from './ChallengesFilters';

type SearchParams = {
  type?: string;
  certification?: string;
};

export default async function ChallengesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const typeFilter = params.type;
  const certificationFilter = params.certification;

  // Получаем все сертификации для фильтра
  const certifications = await prisma.certification.findMany({
    where: { isActive: true },
    orderBy: { title: 'asc' },
  });

  // Формируем запрос с фильтрами
  const whereClause: any = {};
  
  // Фильтр по типу
  if (typeFilter && typeFilter !== 'all') {
    whereClause.type = typeFilter;
  }

  // Фильтр по сертификации
  if (certificationFilter && certificationFilter !== 'all') {
    whereClause.requirements = {
      some: {
        certificationId: certificationFilter,
      },
    };
  }

  const challenges = await prisma.challenge.findMany({
    where: whereClause,
    include: {
      test: true,
      work: true,
      lesson: true,
      requirements: {
        include: {
          certification: true,
        },
      },
      _count: {
        select: {
          attempts: true,
          userStates: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Сертификации</h1>
            <p className="text-gray-500 mt-1">Управление испытаниями и сертификациями</p>
          </div>
          <Link
            href="/admin/challenges/new"
            className="rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]"
          >
            + Создать испытание
          </Link>
        </div>

        {/* Вкладки */}
        <div className="flex gap-2 border-b border-gray-200 mt-4">
          <Link
            href="/admin/certifications"
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
          >
            Сертификации
          </Link>
          <Link
            href="/admin/challenges"
            className="px-4 py-2 text-sm font-medium text-[#5858E2] border-b-2 border-[#5858E2] hover:text-[#4a4ac7]"
          >
            Испытания
          </Link>
        </div>
      </div>

      {/* Фильтры */}
      <ChallengesFilters
        typeFilter={typeFilter}
        certificationFilter={certificationFilter}
        certifications={certifications}
      />

      {challenges.length === 0 ? (
        <div className="rounded-xl border-2 border-[#5858E2]/20 bg-white p-8 text-center shadow-sm">
          <p className="text-gray-500">Испытания не найдены</p>
          <Link
            href="/admin/challenges/new"
            className="mt-4 inline-block rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]"
          >
            Создать первое испытание
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="table-fixed w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-1/4">
                  Название
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-1/6">
                  Сертификации
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-[10%]">
                  Тип
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-[10%]">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-[8%]">
                  Попыток
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-[10%]">
                  Пользователей
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 w-[15%]">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {challenges.map((challenge) => {
                const challengeCertifications = challenge.requirements.map(r => r.certification);
                
                return (
                  <tr key={challenge.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/challenges/${challenge.id}/edit`}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600"
                      >
                        {challenge.title}
                      </Link>
                      {challenge.description && (
                        <div className="mt-1 text-xs text-gray-500 line-clamp-1">
                          {challenge.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {challengeCertifications.length === 0 ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <ul className="text-sm space-y-1">
                          {challengeCertifications.map((cert) => (
                            <li key={cert.id}>
                              <Link
                                href={`/admin/challenges?certification=${cert.id}`}
                                className="text-[#5858E2] hover:underline"
                                title="Фильтровать по этой сертификации"
                              >
                                {cert.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          challenge.type === 'TEST'
                            ? 'bg-blue-100 text-blue-800'
                            : challenge.type === 'WORK'
                            ? 'bg-purple-100 text-purple-800'
                            : challenge.type === 'QUESTIONNAIRE'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {challenge.type === 'TEST' ? 'Тест' :
                         challenge.type === 'WORK' ? 'Работа' :
                         challenge.type === 'QUESTIONNAIRE' ? 'Вопросник' : 'Урок'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          challenge.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {challenge.isActive ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-center">
                      {challenge._count.attempts}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-center">
                      {challenge._count.userStates}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/challenges/${challenge.id}/edit`}
                          className="rounded-lg bg-[#5858E2]/10 px-3 py-1.5 text-xs font-medium text-[#5858E2] transition-colors hover:bg-[#5858E2]/20"
                        >
                          Редактировать
                        </Link>
                        <DeleteChallengeButton challengeId={challenge.id} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}