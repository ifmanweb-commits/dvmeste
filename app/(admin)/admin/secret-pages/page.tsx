import Link from "next/link";
import { prisma } from "@/lib/prisma";
import DeleteSecretPageButton from "./DeleteSecretPageButton";
import SecretsTabs from "../secrets/components/SecretsTabs";

export default async function SecretPagesPage() {
  const pages = await prisma.secretPage.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Секретные страницы</h1>
            <p className="text-gray-500 mt-1">Управление секретными страницами</p>
          </div>
          <Link
            href="/admin/secret-pages/new"
            className="rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]"
          >
            + Создать страницу
          </Link>
        </div>

        {/* Вкладки */}
        <SecretsTabs />

        <div className="mt-6">
        {pages.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
            <p className="text-gray-500">Страницы ещё не созданы</p>
            <Link
              href="/admin/secret-pages/new"
              className="mt-4 inline-block rounded-lg bg-[#5858E2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9]"
            >
              Создать первую страницу
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pages.map((page) => (
              <div
                key={page.id}
                className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-3">
                  <h3 className="text-lg font-bold text-gray-900">{page.title}</h3>
                  {page.description && (
                    <p className="text-sm text-gray-500 mt-1">{page.description}</p>
                  )}
                </div>

                <div className="mb-3 text-sm text-gray-600">
                  <p className="font-mono text-xs text-gray-400">slug: {page.slug}</p>
                </div>

                <div className="mb-4 flex items-center gap-2">
                  <span className={`inline-block h-2 w-2 rounded-full ${page.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                  <span className="text-sm text-gray-600">{page.isActive ? 'Активна' : 'Неактивна'}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/admin/secret-pages/${page.id}/edit`}
                    className="rounded-lg bg-[#5858E2]/10 px-3 py-1.5 text-xs font-medium text-[#5858E2] transition-colors hover:bg-[#5858E2]/20"
                  >
                    Редактировать
                  </Link>
                  <Link
                    href={`/secret-page/${page.slug}`}
                    target="_blank"
                    className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
                  >
                    Открыть
                  </Link>
                  <DeleteSecretPageButton pageId={page.id} />
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}