import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import DeleteCertificationButton from './DeleteCertificationButton';
import HorNav from './HorNav';

export default async function CertificationsPage() {
  const certifications = await prisma.certification.findMany({
    include: {
      requirements: {
        include: {
          challenge: true,
        },
      },
      awards: {
        select: {
          id: true,
          userId: true,
          awardedAt: true,
        },
      },
      _count: {
        select: {
          requirements: true,
          awards: true,
        },
      },
    },
    orderBy: {
      order: 'asc',
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
            href="/admin/certifications/new"
            className="rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]"
          >
            + Создать сертификацию
          </Link>
        </div>

        {/* Вкладки */}
        <HorNav />
      </div>

        {certifications.length === 0 ? (
          <div className="rounded-xl border-2 border-[#5858E2]/20 bg-white p-8 text-center shadow-sm">
            <p className="text-gray-500">Сертификации ещё не созданы</p>
            <Link
              href="/admin/certifications/new"
              className="mt-4 inline-block rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]"
            >
              Создать первую сертификацию
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-[200px]">
                    Название
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Испытания
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Требований
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Выдано
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {certifications.map((certification) => (
                  <tr key={certification.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/certifications/${certification.id}/edit`}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600"
                      >
                        {certification.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      {certification.requirements.length === 0 ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          {certification.requirements.map((req) => req.challenge?.title).filter(Boolean).map((title, i) => (
                            <li key={i}>{title}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <code className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                        {certification.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          certification.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {certification.isActive ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {certification._count.requirements}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {certification._count.awards}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/certifications/${certification.id}/edit`}
                          className="rounded-lg bg-[#5858E2]/10 px-3 py-1.5 text-xs font-medium text-[#5858E2] transition-colors hover:bg-[#5858E2]/20"
                        >
                          Редактировать
                        </Link>
                        <DeleteCertificationButton certificationId={certification.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}
