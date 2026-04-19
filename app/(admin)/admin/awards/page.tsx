import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import DeleteAwardButton from './DeleteAwardButton';
import HorNav from '@/app/(admin)/admin/certifications/HorNav';

export default async function AwardsPage() {
  const awards = await prisma.award.findMany({
    include: {
      certifications: { select: { id: true, title: true } },
      certificationAwards: { select: { id: true, userId: true, awardedAt: true } },
      _count: { select: { certifications: true, certificationAwards: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Награды</h1>
            <p className="text-gray-500 mt-1">Управление наградами: сертификаты и ачивки</p>
          </div>
          <Link href="/admin/awards/new" className="rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]">
            + Создать награду
          </Link>
        </div>
        <HorNav />
      </div>

      {awards.length === 0 ? (
        <div className="rounded-xl border-2 border-[#5858E2]/20 bg-white p-8 text-center shadow-sm">
          <p className="text-gray-500">Награды ещё не созданы</p>
          <Link href="/admin/awards/new" className="mt-4 inline-block rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]">
            Создать первую награду
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Название</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Тип</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Шаблон / Файл</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Статус</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Сертификаций</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Выдано</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {awards.map((award) => (
                <tr key={award.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link href={`/admin/awards/${award.id}/edit`} className="text-sm font-medium text-gray-900 hover:text-blue-600">{award.name}</Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${award.type === 'CERTIFICATE' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {award.type === 'CERTIFICATE' ? 'Сертификат' : 'Ачивка'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {award.type === 'CERTIFICATE' ? (
                      award.certificateTemplateId ? <span className="text-sm text-gray-600">Шаблон назначен</span> : <span className="text-sm text-gray-400">—</span>
                    ) : award.badgeUrl ? (
                      <img src={award.badgeUrl} alt="Badge" className="h-8 w-8 object-contain" />
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${award.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {award.isPublic ? 'Публичная' : 'Скрытая'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{award._count.certifications}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{award._count.certificationAwards}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/awards/${award.id}/edit`} className="rounded-lg bg-[#5858E2]/10 px-3 py-1.5 text-xs font-medium text-[#5858E2] transition-colors hover:bg-[#5858E2]/20">Редактировать</Link>
                      <DeleteAwardButton awardId={award.id} />
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