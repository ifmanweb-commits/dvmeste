import Link from "next/link";
import { getPagesList } from "@/lib/actions/manager-pages";
import { DB_SYNC_MESSAGE } from "@/lib/db-error";
import { Plus, Edit, ExternalLink, FileText, Globe } from "lucide-react";
import DeleteButton from "@/components/pages/DeleteButton";
import AuthGuard from "@/components/AuthGuard";

   
                                              
   
export default async function PagesListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
                      
  const params = await searchParams;
  const errorCode = typeof params.error === "string" ? params.error : "";
  const errorMessages: Record<string, string> = {
    db_sync: DB_SYNC_MESSAGE,
    db_unavailable: "База данных недоступна.",
    delete_failed: "Не удалось удалить страницу.",
    footer_protected: "Системный футер нельзя удалить из общего списка.",
    system_page_protected: "Системные страницы (футер, главная, connect, каталог) нельзя удалить из общего списка.",
  };
  const errorBanner = errorCode ? errorMessages[errorCode] ?? "Произошла ошибка." : null;

  const list = await getPagesList();

  return (
    <AuthGuard requiredPermission="pages.view">
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="mx-auto max-w-[1900px]">
        {errorBanner && (
          <div className="mb-4 rounded-lg border-2 border-amber-300 bg-amber-50 p-3 text-amber-800 sm:rounded-xl sm:p-4">
            <p className="font-medium text-sm sm:text-base">{errorBanner}</p>
          </div>
        )}

        <div className="rounded-xl border-2 border-[#4CAF50]/20 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <h1 className="font-display text-xl font-bold text-gray-900 sm:text-2xl">
                Страницы сайта
              </h1>
              <p className="text-xs text-gray-600 sm:text-sm">
                Всего страниц: {list.length}
              </p>
            </div>
            
            <Link
              href="/managers/pages/new"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#4CAF50] px-4 py-3 text-sm font-medium text-white hover:bg-[#43A047] active:bg-[#388E3C] transition-colors w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Добавить страницу</span>
            </Link>
          </div>

          <p className="mt-3 text-xs text-gray-600 sm:mt-4 sm:text-sm">
            Страницы отображаются по адресу /s/[slug]. Специальные slug: courses → /courses, lib → /lib, contacts → /contacts.
            Главная, connect и каталог психологов редактируются в системных карточках ниже.
            Шаблон «текст» — единый вид страницы. «Пустой» — выводится как чистый HTML-контент без обрамления.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-5">
            <div className="rounded-xl border border-[#4CAF50]/20 bg-[#4CAF50]/5 p-4">
              <p className="text-sm font-medium text-gray-900">Управление футером</p>
              <p className="mt-1 text-xs text-gray-600">
                Полный HTML-код футера, общий для всех публичных страниц.
              </p>
              <Link
                href="/managers/pages/footer"
                className="mt-3 inline-flex items-center rounded-lg bg-[#4CAF50] px-3 py-2 text-xs font-medium text-white hover:bg-[#43A047]"
              >
                Открыть футер
              </Link>
            </div>

            <div className="rounded-xl border border-[#4CAF50]/20 bg-[#4CAF50]/5 p-4">
              <p className="text-sm font-medium text-gray-900">Управление главной</p>
              <p className="mt-1 text-xs text-gray-600">
                Прямое редактирование HTML-кода страницы <code>/</code>.
              </p>
              <Link
                href="/managers/pages/home"
                className="mt-3 inline-flex items-center rounded-lg bg-[#4CAF50] px-3 py-2 text-xs font-medium text-white hover:bg-[#43A047]"
              >
                Открыть главную
              </Link>
            </div>

            <div className="rounded-xl border border-[#4CAF50]/20 bg-[#4CAF50]/5 p-4">
              <p className="text-sm font-medium text-gray-900">Управление connect</p>
              <p className="mt-1 text-xs text-gray-600">
                Прямое редактирование HTML-кода страницы <code>/connect</code>.
              </p>
              <Link
                href="/managers/pages/connect"
                className="mt-3 inline-flex items-center rounded-lg bg-[#4CAF50] px-3 py-2 text-xs font-medium text-white hover:bg-[#43A047]"
              >
                Открыть connect
              </Link>
            </div>

            <div className="rounded-xl border border-[#4CAF50]/20 bg-[#4CAF50]/5 p-4">
              <p className="text-sm font-medium text-gray-900">Страница каталога</p>
              <p className="mt-1 text-xs text-gray-600">
                Верхний и нижний HTML-блоки страницы <code>/psy-list</code>.
              </p>
              <Link
                href="/managers/pages/catalog"
                className="mt-3 inline-flex items-center rounded-lg bg-[#4CAF50] px-3 py-2 text-xs font-medium text-white hover:bg-[#43A047]"
              >
                Открыть каталог
              </Link>
            </div>

            <div className="rounded-xl border border-[#4CAF50]/20 bg-[#4CAF50]/5 p-4">
              <p className="text-sm font-medium text-gray-900">Управление меню</p>
              <p className="mt-1 text-xs text-gray-600">
                Отдельный раздел для добавления, удаления, переименования и сортировки пунктов меню.
              </p>
              <Link
                href="/managers/pages/menu"
                className="mt-3 inline-flex items-center rounded-lg bg-[#4CAF50] px-3 py-2 text-xs font-medium text-white hover:bg-[#43A047]"
              >
                Открыть меню
              </Link>
            </div>
          </div>

          {list.length === 0 ? (
            <div className="mt-6 rounded-xl border-2 border-dashed border-gray-300 p-6 text-center sm:mt-8 sm:p-8">
              <div className="mx-auto max-w-sm">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-3 text-lg font-medium text-gray-900">Нет страниц</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Создайте первую страницу для вашего сайта.
                </p>
                <Link
                  href="/managers/pages/new"
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-[#4CAF50] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#43A047]"
                >
                  <Plus className="h-4 w-4" />
                  Создать страницу
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-900 sm:px-4 sm:py-3.5">
                          Страница
                        </th>
                        <th scope="col" className="hidden px-3 py-3 text-left text-xs font-semibold text-gray-900 sm:table-cell sm:px-4 sm:py-3.5">
                          URL
                        </th>
                        <th scope="col" className="hidden px-3 py-3 text-left text-xs font-semibold text-gray-900 sm:table-cell sm:px-4 sm:py-3.5">
                          Шаблон
                        </th>
                        <th scope="col" className="hidden px-3 py-3 text-left text-xs font-semibold text-gray-900 sm:table-cell sm:px-4 sm:py-3.5">
                          Статус
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-900 sm:px-4 sm:py-3.5">
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {list.map((page) => {
                        const pageUrl = page.slug === "home"
                          ? "/"
                          : ["courses", "lib", "connect", "contacts"].includes(page.slug)
                            ? `/${page.slug}`
                            : `/s/${page.slug}`;
                        
                        return (
                          <tr key={page.id} className="hover:bg-gray-50">
                            <td className="px-3 py-4 sm:px-4">
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900 text-sm sm:text-base">
                                  {page.title}
                                </span>
                                <div className="mt-1 flex flex-wrap gap-1 sm:hidden">
                                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                                    {page.template}
                                  </span>
                                  {!page.isPublished && (
                                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                                      Черновик
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            
                            <td className="hidden px-3 py-4 text-sm text-gray-600 sm:table-cell sm:px-4">
                              <div className="flex items-center gap-1.5">
                                <Globe className="h-3.5 w-3.5 text-gray-400" />
                                <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
                                  {pageUrl}
                                </code>
                              </div>
                            </td>
                            
                            <td className="hidden px-3 py-4 text-sm text-gray-600 sm:table-cell sm:px-4">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                <FileText className="h-3 w-3" />
                                {page.template}
                              </span>
                            </td>
                            
                            <td className="hidden px-3 py-4 sm:table-cell sm:px-4">
                              {page.isPublished ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  Опубликована
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                  Черновик
                                </span>
                              )}
                            </td>
                            
                            <td className="px-3 py-4 sm:px-4">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                                <Link
                                  href={`/managers/pages/${page.id}/edit`}
                                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#4CAF50] px-3 py-2 text-xs font-medium text-white hover:bg-[#43A047] active:bg-[#388E3C] transition-colors w-full sm:w-auto"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                  <span className="sm:hidden">Ред.</span>
                                  <span className="hidden sm:inline">Редактировать</span>
                                </Link>
                                
                                <Link
                                  href={pageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-[#A7FF5A] bg-white px-3 py-2 text-xs font-medium text-gray-900 hover:bg-[#A7FF5A]/10 active:bg-[#A7FF5A]/20 transition-colors w-full sm:w-auto"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  <span className="sm:hidden">Открыть</span>
                                  <span className="hidden sm:inline">На сайте</span>
                                </Link>
                                
                                <DeleteButton pageId={page.id} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 rounded-lg bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                <div className="text-xs text-gray-600 sm:text-sm">
                  <span className="font-medium">{list.length}</span> страниц
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden items-center gap-2 sm:flex">
                    <div className="flex h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-xs text-gray-600">Опубликована</span>
                  </div>
                  <div className="hidden items-center gap-2 sm:flex">
                    <div className="flex h-2 w-2 rounded-full bg-amber-500"></div>
                    <span className="text-xs text-gray-600">Черновик</span>
                  </div>
                  <a href="#" className="text-xs font-medium text-[#4CAF50] hover:text-[#43A047]">
                    Наверх ↑
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}
