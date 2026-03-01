import Link from "next/link";
import AddImageToPage from "@/components/pages/AddImageToPage";
import { createPage } from "@/lib/actions/admin-pages";
import { DB_SYNC_MESSAGE } from "@/lib/db-error";

const ERROR_MESSAGES: Record<string, string> = {
  db_unavailable: "База данных недоступна.",
  fill_title_slug: "Укажите название и slug (латиница, цифры, дефис).",
  duplicate_slug: "Страница с таким slug уже есть. Выберите другой адрес.",
  create_failed: "Не удалось создать страницу. Проверьте данные и попробуйте снова.",
  db_sync: DB_SYNC_MESSAGE,
  invalid_slug: "Slug может содержать только латинские буквы, цифры, дефисы (-) и нижние подчеркивания (_). Без пробелов и спецсимволов.",
};

   
                                                             
   
export default async function NewPageForm({
                                            searchParams,
                                          }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const errorCode = typeof params.error === "string" ? params.error : "";
  const errorMessage = errorCode ? ERROR_MESSAGES[errorCode] ?? "Произошла ошибка." : null;

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="mx-auto max-w-[1900px]">
      <div className="rounded-2xl border-2 border-[#5858E2]/20 bg-white p-8 shadow-lg">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Добавить страницу
        </h1>

        <p className="mt-2 text-sm text-neutral-dark">
          Slug — адрес страницы (только латиница, цифры, дефис). Например: about → /s/about.
          Для прямых адресов работают slug: courses, lib, contacts. 
          Главная (<code>home</code>) и <code>connect</code> теперь редактируются отдельно в разделе «Страницы сайта».
        </p>

        {errorMessage && (
            <div className="mt-4 rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-amber-800">
              <p className="font-medium">{errorMessage}</p>
            </div>
        )}

        <form action={createPage} className="mt-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground">Название страницы *</label>
            <input
                type="text"
                name="title"
                required
                placeholder="О проекте"
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-foreground focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              URL-адрес
              <span className="ml-2 text-xs text-amber-600">только латиница, цифры, дефис, нижнее подчеркивание</span>
            </label>

            <div className="relative">
              <input
                  type="text"
                  name="slug"
                  required
                  placeholder="about"
                  pattern="[a-z0-9\-_]+"
                  title="Только латиница, цифры, дефис и нижнее подчеркивание. Без пробелов!"
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-foreground focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20 outline-none transition"
              />

              {                                          }
              <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <span className="text-gray-400">📌</span>
                Будет доступно по адресу: <span className="font-mono text-[#5858E2] bg-[#5858E2]/5 px-1.5 py-0.5 rounded">/s/[ваш-slug]</span>
              </p>
            </div>

          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Шаблон</label>
            <select
                name="template"
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-foreground focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20 outline-none transition"
            >
              <option value="text">Текст (заголовок + контент)</option>
              <option value="empty">Пустой (свой HTML)</option>
            </select>
          </div>

          <div>
            {                                         }
            <div className="mt-4">
              <h3 className="text-sm font-medium text-foreground mb-2">Добавить файлы для страницы</h3>
              <div className="w-full">
                <AddImageToPage />
              </div>
              <p className="mt-1 text-xs text-neutral-dark">
                Загрузите файлы — они сохранятся автоматически и будут доступны для вставки в HTML контент страницы.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Контент</label>
            <textarea
                name="content"
                rows={12}
                placeholder="Для «текст» — HTML абзацев. Для «пустой» — полная HTML-страница."
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-sm text-foreground focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20 outline-none transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
                type="hidden"
                name="isPublished"
                value="off"
            />
            <input
                type="checkbox"
                name="isPublished"
                id="isPublished"
                value="on"
                className="w-4 h-4 rounded border-gray-300 text-[#5858E2] focus:ring-[#5858E2]"
            />
            <label htmlFor="isPublished" className="text-sm font-medium text-foreground">
              Опубликовать (показывать на сайте)
            </label>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-sm font-medium text-foreground">Элементы шаблона</p>
            <p className="mt-1 text-xs text-neutral-dark">Для страниц `/s/[slug]` можно отдельно включить шапку и футер сайта.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="hidden" name="showHeader" value="off" />
                <input
                  type="checkbox"
                  name="showHeader"
                  value="on"
                  className="h-4 w-4 rounded border-gray-300 text-[#5858E2] focus:ring-[#5858E2]"
                />
                Добавить хедер
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="hidden" name="showFooter" value="off" />
                <input
                  type="checkbox"
                  name="showFooter"
                  value="on"
                  className="h-4 w-4 rounded border-gray-300 text-[#5858E2] focus:ring-[#5858E2]"
                />
                Добавить футер
              </label>
            </div>
          </div>

          <div className="flex gap-4">
            <button
                type="submit"
                className="rounded-xl bg-[#5858E2] px-6 py-2 font-medium text-white hover:bg-[#4848d0] transition-colors"
            >
              Создать страницу
            </button>
            <Link
                href="/admin/pages"
                className="rounded-xl border border-neutral-300 px-6 py-2 font-medium text-foreground hover:bg-[#F5F5F7] transition-colors"
            >
              Отмена
            </Link>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}
