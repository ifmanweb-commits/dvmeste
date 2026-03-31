'use client';

import { deleteCourseKey } from "@/lib/actions/courses";

export default function DeleteCourseKeyButton({ courseKeyId, courseId }: { courseKeyId: string; courseId: string }) {
  return (
    <form action={async () => {
      await deleteCourseKey(courseKeyId);
    }}>
      <button
        type="submit"
        onClick={(e) => {
          if (!confirm("Вы уверены, что хотите удалить этот промокод?")) {
            e.preventDefault();
          }
        }}
        className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
      >
        Удалить
      </button>
    </form>
  );
}