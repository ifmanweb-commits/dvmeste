import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft } from "lucide-react";

export default async function ModerationArticlesPage() {
  const user = await getCurrentUser();
  
  // Проверка прав
  if (!user?.isAdmin && !user?.isManager) {
    redirect("/admin");
  }

  // Получаем статьи в статусе PENDING
  const articles = await prisma.article.findMany({
    where: { 
      moderationStatus: "PENDING" 
    },
    orderBy: { 
      submittedAt: "asc" // самые старые сверху
    },
    select: {
      id: true,
      title: true,
      submittedAt: true,
      user: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      }
    }
  });

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <div className="">
        {/* Ссылка назад */}
        <div className="mb-4">
          <Link
            href="/admin/moderation"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Назад к модерации
          </Link>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Модерация статей</h1>
            <p className="text-gray-500 mt-1">Статьи, ожидающие проверки</p>
          </div>
          <Link
            href="/admin/articles"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5858E2] text-white text-sm font-medium rounded-lg hover:bg-[#4a4ac9] transition-colors"
          >
            Перейти к статьям
          </Link>
        </div>

      {articles.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Нет статей, ожидающих модерации</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Заголовок
                </th>
                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Автор
                </th>
                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата отправки
                </th>
                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действие
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {articles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link 
                      href={`/admin/moderation/articles/${article.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {article.title || "Без названия"}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">
                        {article.user?.fullName || "Не указан"}
                      </div>
                      {article.user?.email && (
                        <div className="text-sm text-gray-500">
                          {article.user.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {article.submittedAt ? (
                      format(new Date(article.submittedAt), "dd MMM yyyy, HH:mm", { locale: ru })
                    ) : (
                      "Не указана"
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/moderation/articles/${article.id}`}
                      className="inline-flex items-center px-3 py-2 bg-[#5858E2] text-white text-sm rounded-md hover:bg-[#4848d0] transition-colors"
                    >
                      Модерировать
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  );
}
