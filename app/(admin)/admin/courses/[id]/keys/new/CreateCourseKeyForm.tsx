'use client';

import Link from "next/link";
import { createCourseKey } from "@/lib/actions/courses";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateCourseKeyForm({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setError(null);

    const key = formData.get("key") as string;
    const status = formData.get("status") as 'enrolled' | 'graduated';
    const maxUses = parseInt(formData.get("maxUses") as string, 10) || 0;
    const expiresAtStr = formData.get("expiresAt") as string;
    const expiresAt = expiresAtStr ? new Date(expiresAtStr) : null;

    const result = await createCourseKey({
      courseId,
      key: key || undefined,
      status,
      maxUses,
      expiresAt,
    });

    setIsSubmitting(false);

    if (result.success) {
      router.push(`/admin/courses/${courseId}/keys`);
      router.refresh();
    } else {
      setError(result.error || "Ошибка при создании промокода");
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
          <label htmlFor="key" className="block text-sm font-medium text-gray-700">
            Ключ
          </label>
          <input
            type="text"
            id="key"
            name="key"
            disabled={isSubmitting}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2] disabled:bg-gray-100"
            placeholder="Оставьте пустым для автогенерации"
          />
          <p className="mt-1 text-xs text-gray-500">Если оставить пустым, ключ будет сгенерирован автоматически</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Тип
          </label>
          <div className="mt-2 space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="status"
                value="enrolled"
                defaultChecked
                disabled={isSubmitting}
                className="h-4 w-4 text-[#5858E2] focus:ring-[#5858E2]"
              />
              <span className="ml-2 text-sm text-gray-700">Ученик</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="status"
                value="graduated"
                disabled={isSubmitting}
                className="h-4 w-4 text-[#5858E2] focus:ring-[#5858E2]"
              />
              <span className="ml-2 text-sm text-gray-700">Выпускник</span>
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="maxUses" className="block text-sm font-medium text-gray-700">
            Лимит использований
          </label>
          <input
            type="number"
            id="maxUses"
            name="maxUses"
            min="0"
            defaultValue={0}
            disabled={isSubmitting}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2] disabled:bg-gray-100"
          />
          <p className="mt-1 text-xs text-gray-500">0 — без ограничений</p>
        </div>

        <div>
          <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700">
            Срок действия
          </label>
          <input
            type="date"
            id="expiresAt"
            name="expiresAt"
            disabled={isSubmitting}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2] disabled:bg-gray-100"
          />
          <p className="mt-1 text-xs text-gray-500">Оставьте пустым для бессрочного действия</p>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9] disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isSubmitting ? "Создание..." : "Создать промокод"}
        </button>
        <Link
          href={`/admin/courses/${courseId}/keys`}
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
        >
          Отмена
        </Link>
      </div>
    </form>
  );
}