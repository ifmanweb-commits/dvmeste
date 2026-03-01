import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrCreateCatalogPage, updateCatalogPageSections } from "@/lib/actions/admin-pages";
import { parseCatalogPageSections } from "@/lib/catalog-page-config";
import { DB_SYNC_MESSAGE } from "@/lib/db-error";

const ERROR_MESSAGES: Record<string, string> = {
  db_unavailable: "База данных недоступна.",
  db_sync: DB_SYNC_MESSAGE,
  update_failed: "Не удалось сохранить настройки страницы каталога.",
};

export default async function AdminCatalogPageSettings({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [page, params] = await Promise.all([getOrCreateCatalogPage(), searchParams]);

  if (!page) {
    redirect("/admin/pages?error=db_unavailable");
  }

  const sections = parseCatalogPageSections(page.content);
  const saved = params.saved === "1";
  const errorCode = typeof params.error === "string" ? params.error : "";
  const errorBanner = errorCode ? ERROR_MESSAGES[errorCode] ?? "Произошла ошибка." : null;

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="mx-auto max-w-[1900px]">
        <div className="mb-4">
          <Link href="/admin/pages" className="text-sm font-medium text-[#5858E2] hover:text-[#4848d0]">
            ← Назад к страницам
          </Link>
        </div>

        {saved && !errorBanner && (
          <div className="mb-4 rounded-lg border-2 border-green-300 bg-green-50 p-3 text-green-800 sm:rounded-xl sm:p-4">
            <p className="font-medium text-sm sm:text-base">Настройки каталога сохранены.</p>
          </div>
        )}

        {errorBanner && (
          <div className="mb-4 rounded-lg border-2 border-amber-300 bg-amber-50 p-3 text-amber-800 sm:rounded-xl sm:p-4">
            <p className="font-medium text-sm sm:text-base">{errorBanner}</p>
          </div>
        )}

        <div className="rounded-xl border-2 border-[#5858E2]/20 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6 lg:p-8">
          <h1 className="font-display text-xl font-bold text-gray-900 sm:text-2xl">Страница каталога</h1>
          <p className="mt-2 text-xs text-gray-600 sm:text-sm">
            Настройка HTML-блоков страницы <code>/psy-list</code>. Верхний блок выводится до каталога, нижний — после.
            Если верхний блок пустой, каталог показывается сразу после меню.
          </p>

          <form action={updateCatalogPageSections} className="mt-6 space-y-6">
            <div>
              <label htmlFor="topHtml" className="block text-sm font-medium text-gray-900">
                Верхний текст (HTML)
              </label>
              <textarea
                id="topHtml"
                name="topHtml"
                rows={16}
                defaultValue={sections.topHtml}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm text-gray-900 focus:border-[#5858E2] focus:outline-none focus:ring-2 focus:ring-[#5858E2]/20"
                placeholder="<section>...</section>"
              />
            </div>

            <div>
              <label htmlFor="bottomHtml" className="block text-sm font-medium text-gray-900">
                Нижний текст (HTML)
              </label>
              <textarea
                id="bottomHtml"
                name="bottomHtml"
                rows={14}
                defaultValue={sections.bottomHtml}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm text-gray-900 focus:border-[#5858E2] focus:outline-none focus:ring-2 focus:ring-[#5858E2]/20"
                placeholder="<section>...</section>"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg bg-[#5858E2] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#4848d0]"
              >
                Сохранить
              </button>
              <Link
                href="/psy-list"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Открыть каталог
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
