import Link from "next/link";
import { getCourseKeyById } from "@/lib/actions/courses";
import { notFound } from "next/navigation";
import EditCourseKeyForm from "./EditCourseKeyForm";

export default async function EditCourseKeyPage({
  params,
}: {
  params: Promise<{ id: string; keyId: string }>;
}) {
  const { id, keyId } = await params;
  const courseKey = await getCourseKeyById(keyId);

  if (!courseKey) {
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
            Редактирование промокода
          </h1>
        </div>

        <div className="rounded-xl border-2 border-[#5858E2]/20 bg-white p-6 shadow-sm">
          <EditCourseKeyForm
            courseKeyId={keyId}
            courseId={id}
            initialData={{
              key: courseKey.key,
              status: courseKey.status as 'enrolled' | 'graduated',
              maxUses: courseKey.maxUses,
              expiresAt: courseKey.expiresAt,
            }}
          />
        </div>
      </div>
    </div>
  );
}