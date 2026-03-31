'use client';

import { deleteCourse } from "@/lib/actions/courses";

export default function DeleteCourseButton({ courseId }: { courseId: string }) {
  return (
    <form action={async () => {
      await deleteCourse(courseId);
    }}>
      <button
        type="submit"
        onClick={(e) => {
          if (!confirm("Вы уверены, что хотите удалить этот курс? Все связанные промокоды будут удалены.")) {
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