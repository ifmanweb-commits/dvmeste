import { notFound } from "next/navigation";
import { getPageById, updatePage } from "@/lib/actions/manager-pages";
import EditPageClient from "@/components/pages/EditPageClient";
import { getSystemPageBySlug } from "@/lib/system-pages";

export default async function EditPagePage({
                                             params,
                                             searchParams,
                                           }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
                               
  const { id } = await params;
  const searchParamsObj = await searchParams;

                             
  const page = await getPageById(id);

  if (!page) {
    notFound();
  }

  const errorMessages: Record<string, string> = {
    fill_title_slug: "Заполните заголовок корректно.",
    duplicate_slug: "Страница с таким URL уже существует.",
    update_failed: "Не удалось обновить страницу.",
    invalid_slug: "URL может содержать только латинские буквы, цифры и дефисы (-).",
    db_sync: "Ошибка базы данных. Проверьте подключение.",
  };

  const errorCode = typeof searchParamsObj.error === "string" ? searchParamsObj.error : "";
  const errorBanner = errorCode ? errorMessages[errorCode] ?? "Произошла ошибка." : null;
  const savedBanner = searchParamsObj.saved === "1" ? "Изменения сохранены." : null;
  const systemPage = getSystemPageBySlug(page.slug);
  const isSystemPage = Boolean(systemPage);

  return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
        <div className="mx-auto max-w-[1900px]">
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold text-gray-900">
              {isSystemPage ? `Редактирование: ${systemPage?.title}` : `Редактирование: ${page.title}`}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {isSystemPage
                ? systemPage?.description
                : "Измените данные страницы."}
            </p>
          </div>

          {errorBanner && (
              <div className="mb-4 rounded-lg border-2 border-red-300 bg-red-50 p-3 text-red-800 sm:rounded-xl sm:p-4">
                <p className="font-medium text-sm sm:text-base">{errorBanner}</p>
              </div>
          )}

          {savedBanner && !errorBanner && (
              <div className="mb-4 rounded-lg border-2 border-green-300 bg-green-50 p-3 text-green-800 sm:rounded-xl sm:p-4">
                <p className="font-medium text-sm sm:text-base">{savedBanner}</p>
              </div>
          )}

          {                                        }
          <EditPageClient
              page={page}
              pageId={id}
              updatePage={updatePage}
          />
        </div>
      </div>
  );
}
