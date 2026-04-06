import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import DeleteChallengeButton from './DeleteChallengeButton';

export default async function ChallengesPage() {
  const challenges = await prisma.challenge.findMany({
    include: {
      test: true,
      work: true,
      lesson: true,
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
    <div className="p-3 sm:p-4 md:p-6">
      <div className="mx-auto max-w-[1900px]">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/certifications"
                className="text-lg font-medium text-gray-500 transition-colors hover:text-gray-700 sm:text-xl"
              >
                Сертификации
              </Link>
              <span className="h-6 w-px bg-gray-300"></span>
              <Link
                href="/admin/challenges"
                className="text-lg font-bold text-[#5858E2] sm:text-xl"
              >
                Испытания
              </Link>
            </div>
            <Link
              href="/admin/challenges/new"
              className="rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]"
            >
              + Создать испытание
            </Link>
          </div>
        </div>

        {challenges.length === 0 ? (
          <div className="rounded-xl border-2 border-[#5858E2]/20 bg-white p-8 text-center shadow-sm">
            <p className="text-gray-500">Испытания ещё не созданы</p>
            <Link
              href="/admin/challenges/new"
              className="mt-4 inline-block rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]"
            >
              Создать первое испытание
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Название
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Тип
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Попыток
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Пользователей
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {challenges.map((challenge) => (
                  <tr key={challenge.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {challenge.title}
                      </div>
                      {challenge.description && (
                        <div className="mt-1 text-xs text-gray-500 line-clamp-1">
                          {challenge.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <code className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                        {challenge.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          challenge.type === 'TEST'
                            ? 'bg-blue-100 text-blue-800'
                            : challenge.type === 'WORK'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {challenge.type === 'TEST' ? 'Тест' :
                         challenge.type === 'WORK' ? 'Работа' : 'Урок'}
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
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {challenge._count.attempts}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}