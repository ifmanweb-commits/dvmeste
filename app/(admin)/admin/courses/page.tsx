import Link from "next/link";
import { getAllCourses, deleteCourse } from "@/lib/actions/courses";
import DeleteCourseButton from "./DeleteCourseButton";

export default async function CoursesPage() {
  const courses = await getAllCourses();

  return (
    <div className="">
      <div className="mb-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Курсы</h1>
            <p className="text-gray-500 mt-1">Управление курсами и промокодами</p>
          </div>
          <Link
            href="/admin/courses/new"
            className="rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]"
          >
            + Создать курс
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-xl border-2 border-[#5858E2]/20 bg-white p-8 text-center shadow-sm">
            <p className="text-gray-500">Курсы ещё не созданы</p>
            <Link
              href="/admin/courses/new"
              className="mt-4 inline-block rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]"
            >
              Создать первый курс
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="rounded-xl border-2 border-[#5858E2]/20 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-3">
                  <h3 className="text-lg font-bold text-gray-900">{course.title}</h3>
                  <p className="text-sm text-gray-500">({course.shortTitle})</p>
                </div>

                <div className="mb-3 text-sm text-gray-600">
                  <p className="font-mono text-xs text-gray-400">slug: {course.slug}</p>
                </div>

                <div className="mb-4 flex gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-blue-500"></span>
                    <span className="text-gray-600">Учеников:</span>
                    <span className="font-medium">{course.enrolledCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                    <span className="text-gray-600">Выпускников:</span>
                    <span className="font-medium">{course.graduatedCount}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/admin/courses/${course.id}/keys`}
                    className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
                  >
                    Промокоды
                  </Link>
                  <Link
                    href={`/admin/courses/${course.id}/students`}
                    className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
                  >
                    Студенты
                  </Link>
                  <Link
                    href={`/admin/courses/${course.id}/edit`}
                    className="rounded-lg bg-[#5858E2]/10 px-3 py-1.5 text-xs font-medium text-[#5858E2] transition-colors hover:bg-[#5858E2]/20"
                  >
                    Редактировать
                  </Link>
                  <DeleteCourseButton courseId={course.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}