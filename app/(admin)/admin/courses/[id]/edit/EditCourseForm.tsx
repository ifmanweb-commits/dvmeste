'use client';

import Link from "next/link";
import { updateCourse } from "@/lib/actions/courses";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface EditCourseFormProps {
  courseId: string;
  initialData: {
    title: string;
    shortTitle: string;
    slug: string;
    description?: string | null;
  };
}

export default function EditCourseForm({ courseId, initialData }: EditCourseFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setError(null);

    const title = formData.get("title") as string;
    const shortTitle = formData.get("shortTitle") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description") as string;

    const result = await updateCourse(courseId, {
      title,
      shortTitle,
      slug,
      description: description || undefined,
    });

    setIsSubmitting(false);

    if (result.success) {
      router.push("/admin/courses");
      router.refresh();
    } else {
      setError(result.error || "Ошибка при обновлении курса");
    }
  };

  return (
    <form action={handleSubmit}>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Название курса *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            disabled={isSubmitting}
            defaultValue={initialData.title}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2] disabled:bg-gray-100"
          />
        </div>

        <div>
          <label htmlFor="shortTitle" className="block text-sm font-medium text-gray-700">
            Короткое название *
          </label>
          <input
            type="text"
            id="shortTitle"
            name="shortTitle"
            required
            disabled={isSubmitting}
            defaultValue={initialData.shortTitle}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2] disabled:bg-gray-100"
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
            Slug *
          </label>
          <input
            type="text"
            id="slug"
            name="slug"
            required
            disabled={isSubmitting}
            defaultValue={initialData.slug}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2] disabled:bg-gray-100"
          />
          <p className="mt-1 text-xs text-gray-500">Уникальный идентификатор курса</p>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Описание
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            disabled={isSubmitting}
            defaultValue={initialData.description || ""}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2] disabled:bg-gray-100"
          />
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9] disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isSubmitting ? "Сохранение..." : "Сохранить изменения"}
        </button>
        <Link
          href="/admin/courses"
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
        >
          Отмена
        </Link>
      </div>
    </form>
  );
}