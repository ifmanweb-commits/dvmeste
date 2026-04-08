import Link from "next/link";
import { getAllSecretPages, getAllCourses, getAllChallenges, getKeyById } from "../../actions";
import KeyForm from "../../new/KeyForm";

export default async function EditKeyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const key = await getKeyById(id);
  
  if (!key) {
    return (
      <div className="p-6">
        <p className="text-red-600">Ключ не найден</p>
        <Link href="/admin/keys" className="text-sm text-[#5858E2] hover:underline mt-2 inline-block">
          ← Назад к ключам
        </Link>
      </div>
    );
  }

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

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Редактировать ключ</h1>
        <p className="text-gray-500 mb-6">Изменение ключа доступа</p>

        <KeyForm
          pages={pages}
          courses={courses}
          challenges={challenges}
          initialData={{
            id: key.id,
            code: key.code,
            maxUses: key.maxUses,
            expiresAt: key.expiresAt?.toISOString() || null,
            isActive: key.isActive,
            actionsJson: key.actionsJson as { actions: any[] },
          }}
        />
      </div>
    </div>
  );
}