import Link from "next/link";
import { getCourseById, getCourseKeys } from "@/lib/actions/courses";
import { notFound } from "next/navigation";
import DeleteCourseKeyButton from "./DeleteCourseKeyButton";
import CopyKeyButton from "./CopyKeyButton";

export default async function CourseKeysPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [course, keys] = await Promise.all([
    getCourseById(id),
    getCourseKeys(id),
  ]);

  if (!course) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <Link
              href="/admin/courses"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Назад к курсам
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">
              Промокоды: {course.title}
            </h1>
          </div>
          <Link
            href={`/admin/courses/${id}/keys/new`}
            className="rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]"
          >
            + Создать промокод
          </Link>
        </div>
      </div>

      {keys.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <p className="text-gray-500">Промокоды ещё не созданы</p>
          <Link
            href={`/admin/courses/${id}/keys/new`}
            className="mt-4 inline-block rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]"
          >
            Создать первый промокод
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Ключ
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Тип
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Использовано
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Срок действия
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {keys.map((key) => (
                <tr key={key.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-gray-100 px-2 py-1 text-sm font-mono">
                        {key.key}
                      </code>
                      <CopyKeyButton keyText={key.key} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      key.status === 'enrolled'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {key.status === 'enrolled' ? 'Ученик' : 'Выпускник'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {key.usedCount} / {key.maxUses === 0 ? '∞' : key.maxUses}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {key.expiresAt ? (
                      <span className={key.expiresAt < new Date() ? 'text-red-600' : ''}>
                        {new Date(key.expiresAt).toLocaleDateString('ru-RU')}
                      </span>
                    ) : (
                      <span className="text-gray-400">Бессрочно</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/courses/${id}/keys/${key.id}/edit`}
                        className="rounded-lg bg-[#5858E2]/10 px-3 py-1.5 text-xs font-medium text-[#5858E2] transition-colors hover:bg-[#5858E2]/20"
                      >
                        Редактировать
                      </Link>
                      <DeleteCourseKeyButton courseKeyId={key.id} courseId={id} />
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