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
    <div>
      <div className="mb-6">
        <Link
          href={`/admin/courses/${id}/keys`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Назад к промокодам
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">
          Новый промокод: {course.title}
        </h1>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <CreateCourseKeyForm courseId={id} />
      </div>
    </div>
  );
}