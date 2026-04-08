import Link from "next/link";
import { getAllSecretPages, getAllCourses, getAllChallenges } from "../actions";
import KeyForm from "./KeyForm";

export default async function NewKeyPage() {
  const [pages, courses, challenges] = await Promise.all([
    getAllSecretPages(),
    getAllCourses(),
    getAllChallenges(),
  ]);

  return (
    <div>
      <div className="mb-6">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/admin/keys"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Назад к ключам
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Создать ключ</h1>
        <p className="text-gray-500 mb-6">Настройка нового ключа доступа</p>

        <KeyForm
          pages={pages}
          courses={courses}
          challenges={challenges}
          initialData={undefined}
        />
      </div>
    </div>
  );
}