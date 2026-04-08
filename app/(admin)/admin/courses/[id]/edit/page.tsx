import Link from "next/link";
import { getCourseById } from "@/lib/actions/courses";
import { notFound } from "next/navigation";
import EditCourseForm from "./EditCourseForm";
import CourseChallengesSection from "./CourseChallengesSection";
import { prisma } from "@/lib/prisma";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await getCourseById(id);

  if (!course) {
    notFound();
  }

  // Получаем все тесты (Challenge типа TEST)
  const challenges = await prisma.challenge.findMany({
    where: { type: "TEST", isActive: true },
    include: {
      test: true,
    },
    orderBy: { title: "asc" },
  });

  // Получаем текущие связи курса с испытаниями
  const courseAccesses = await prisma.courseChallengeAccess.findMany({
    where: { courseId: id },
    orderBy: { order: "asc" },
  });

  // Разделяем на учеников и выпускников
  const enrolledChallengeIds = courseAccesses
    .filter((a) => a.status === "enrolled")
    .map((a) => a.challengeId);

  const graduatedChallengeIds = courseAccesses
    .filter((a) => a.status === "graduated")
    .map((a) => a.challengeId);

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/courses"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Назад к курсам
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">
          Редактирование курса
        </h1>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <EditCourseForm
          courseId={id}
          initialData={{
            title: course.title,
            shortTitle: course.shortTitle,
            slug: course.slug,
            description: course.description,
          }}
        />
      </div>

      {/* Раздел с испытаниями для учеников */}
      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <CourseChallengesSection
          courseId={id}
          challenges={challenges}
          selectedChallengeIds={enrolledChallengeIds}
          status="enrolled"
          title="Ученики курса имеют доступ к тестам:"
        />
      </div>

      {/* Раздел с испытаниями для выпускников */}
      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <CourseChallengesSection
          courseId={id}
          challenges={challenges}
          selectedChallengeIds={graduatedChallengeIds}
          status="graduated"
          title="Выпускники курса имеют доступ к тестам:"
        />
      </div>
    </div>
  );
}