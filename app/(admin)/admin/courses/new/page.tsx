import Link from "next/link";
import { createCourse } from "@/lib/actions/courses";
import { redirect } from "next/navigation";
import CreateCourseForm from "./CreateCourseForm";

export default function NewCoursePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="mx-auto max-w-[800px]">
        <div className="mb-6">
          <Link
            href="/admin/courses"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Назад к курсам
          </Link>
          <h1 className="mt-2 font-display text-xl font-bold text-gray-900 sm:text-2xl">
            Новый курс
          </h1>
        </div>

        <div className="rounded-xl border-2 border-[#5858E2]/20 bg-white p-6 shadow-sm">
          <CreateCourseForm />
        </div>
      </div>
    </div>
  );
}
