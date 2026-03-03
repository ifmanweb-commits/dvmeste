import Link from "next/link";
import AddImageToPage from "@/components/pages/AddImageToPage";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getPageById } from "@/lib/actions/admin-pages";
import { getSystemPageBySlug } from "@/lib/system-pages";
import PageEditForm from "@/components/admin/PageEditForm";


const EDIT_ERRORS: Record<string, string> = {
  fill_title_slug: "Укажите название и slug (латиница, цифры, дефис).",
  duplicate_slug: "Страница с таким slug уже есть.",
  update_failed: "Не удалось сохранить. Проверьте данные.",
  db_sync: "Ошибка базы данных. Выполните: npx prisma db push",
  invalid_slug: "Slug может содержать только латинские буквы, цифры, дефисы (-) и нижние подчеркивания (_). Без пробелов и спецсимволов.",
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditPageForm({ params, searchParams }: PageProps) {
  const { id } = await params;
  const page = await getPageById(id);
  if (!page) notFound();

  const sp = await searchParams;
  const errorCode = typeof sp.error === "string" ? sp.error : "";
  const errorMessage = errorCode ? EDIT_ERRORS[errorCode] ?? "Ошибка сохранения." : null;
  const isSaved = sp.saved === "1";
  const systemPage = getSystemPageBySlug(page.slug);
  const isSystemPage = Boolean(systemPage);
  const currentPublicPath = page.slug === "home" ? "/" : `/s/${page.slug}`;

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="mx-auto max-w-[1900px]">
        <div className="mb-4">
          <Link
            href="/admin/pages"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#5858E2] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад к списку страниц
          </Link>
        </div>
        <div className="rounded-2xl border-2 border-[#5858E2]/20 bg-white p-8 shadow-lg">
          <h1 className="font-display text-2xl font-bold text-foreground">
            {isSystemPage ? `Редактирование: ${systemPage?.title}` : `Редактировать: ${page.adminTitle}`}
          </h1>
          <p className="mt-2 text-sm text-neutral-dark">
            {isSystemPage
              ? systemPage?.description
              : `Адрес: ${currentPublicPath}`}
          </p>

          {isSaved && !errorMessage && (
            <div className="mt-4 rounded-xl border-2 border-green-300 bg-green-50 p-4 text-green-800">
              <p className="font-medium">Изменения сохранены.</p>
            </div>
          )}

          {errorMessage && (
            <div className="mt-4 rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-amber-800">
              <p className="font-medium">{errorMessage}</p>
            </div>
          )}

          <PageEditForm 
            page={page}
            isSystemPage={isSystemPage}
            systemPage={systemPage}
            currentPublicPath={currentPublicPath}
          />
        </div>
      </div>
    </div>
  );
}