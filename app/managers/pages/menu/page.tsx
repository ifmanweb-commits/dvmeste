import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import { getSiteMenuItems, getSiteMenuPageOptions } from "@/lib/site-menu";
import { SiteMenuManager } from "@/components/pages/SiteMenuManager";

export default async function ManagersMenuPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await searchParams;
  const [menuItems, pageOptions] = await Promise.all([getSiteMenuItems(), getSiteMenuPageOptions()]);

  return (
    <AuthGuard requiredPermission="pages.view">
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
        <div className="mx-auto max-w-[1900px]">
          <div className="mb-4">
            <Link href="/managers/pages" className="text-sm font-medium text-[#4CAF50] hover:text-[#43A047]">
              ← Назад к страницам
            </Link>
          </div>

          <div className="mb-4 rounded-lg border border-[#4CAF50]/20 bg-[#4CAF50]/5 p-3 text-sm text-[#2e7d32] sm:rounded-xl sm:p-4">
            Сортировка выполняется перетаскиванием строк, как в разделе «Списки данных». После изменений нажмите
            «Сохранить меню».
          </div>

          <div className="rounded-xl border-2 border-[#4CAF50]/20 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6 lg:p-8">
            <h1 className="font-display text-xl font-bold text-gray-900 sm:text-2xl">Управление меню сайта</h1>
            <p className="mt-2 text-xs text-gray-600 sm:text-sm">
              Логотип с названием слева ведет на главную и редактируется отдельно. Здесь управляются только пункты
              навигации справа.
            </p>

            <SiteMenuManager scope="manager" initialItems={menuItems} pageOptions={pageOptions} />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
