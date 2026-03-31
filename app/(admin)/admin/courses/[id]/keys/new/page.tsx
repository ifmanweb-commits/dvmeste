import Link from "next/link";
import { getCourseById } from "@/lib/actions/courses";
import { notFound } from "next/navigation";
import CreateCourseKeyForm from "./CreateCourseKeyForm";

export default async function NewCourseKeyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await getCourseById(id);

  if (!course) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="mx-auto max-w-[800px]">
        <div className="mb-6">
          <Link
            href={`/admin/courses/${id}/keys`}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Назад к промокодам
          </Link>
          <h1 className="mt-2 font-display text-xl font-bold text-gray-900 sm:text-2xl">
            Новый промокод: {course.title}
          </h1>
        </div>

        <div className="rounded-xl border-2 border-[#5858E2]/20 bg-white p-6 shadow-sm">
          <CreateCourseKeyForm courseId={id} />
        </div>
      </div>
    </div>
  );
}