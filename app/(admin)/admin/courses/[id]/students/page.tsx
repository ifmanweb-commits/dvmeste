import Link from "next/link";
import { getCourseById, getCourseStudents } from "@/lib/actions/courses";
import { notFound } from "next/navigation";

export default async function CourseStudentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { id } = await params;
  const { status } = await searchParams;
  const [course, students] = await Promise.all([
    getCourseById(id),
    getCourseStudents(id, status),
  ]);

  if (!course) {
    notFound();
  }

  const currentStatus = status === 'graduated' ? 'graduated' : (status === 'enrolled' ? 'enrolled' : 'all');

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-6">
          <Link
            href="/admin/courses"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Назад к курсам
          </Link>
          <div className="mt-2 flex items-center justify-between">
            <h1 className="font-display text-xl font-bold text-gray-900 sm:text-2xl">
              Студенты: {course.title}
            </h1>
            <div className="flex gap-2">
              <Link
                href={`/admin/courses/${id}/students`}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  currentStatus === 'all'
                    ? 'bg-[#5858E2] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Все
              </Link>
              <Link
                href={`/admin/courses/${id}/students?status=enrolled`}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  currentStatus === 'enrolled'
                    ? 'bg-[#5858E2] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Ученики
              </Link>
              <Link
                href={`/admin/courses/${id}/students?status=graduated`}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  currentStatus === 'graduated'
                    ? 'bg-[#5858E2] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Выпускники
              </Link>
            </div>
          </div>
        </div>

        {students.length === 0 ? (
          <div className="rounded-xl border-2 border-[#5858E2]/20 bg-white p-8 text-center shadow-sm">
            <p className="text-gray-500">
              {currentStatus === 'all'
                ? 'Студентов пока нет'
                : currentStatus === 'enrolled'
                ? 'Учеников пока нет'
                : 'Выпускников пока нет'}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border-2 border-[#5858E2]/20 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Психолог
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Статус
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Дата зачисления
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {students.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/psychologists/${enrollment.user.id}/edit`}
                        className="text-sm font-medium text-[#5858E2] hover:underline"
                      >
                        {enrollment.user.fullName || 'Без имени'}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {enrollment.user.email}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        enrollment.status === 'enrolled'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {enrollment.status === 'enrolled' ? 'Ученик' : 'Выпускник'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(enrollment.assignedAt).toLocaleDateString('ru-RU')}
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