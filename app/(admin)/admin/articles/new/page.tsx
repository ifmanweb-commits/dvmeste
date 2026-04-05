import Link from "next/link";
import { getPsychologistsList } from "@/lib/actions/admin-psychologists";
import ArticleNewClient from "./ArticleNewClient";

export default async function AdminArticleNewPage() {
  const psychologists = await getPsychologistsList();

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <div className="mb-6">
        <Link href="/admin/articles" className="text-sm text-gray-600 hover:text-gray-900">
          ← Вернуться к статьям
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Создание статьи</h1>
      </div>

      <ArticleNewClient psychologists={psychologists} />
    </div>
  );
}
