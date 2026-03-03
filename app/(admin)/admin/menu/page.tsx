import Link from "next/link";
import { getSiteMenuItems, getSiteMenuPageOptions } from "@/lib/site-menu";
import { SiteMenuManager } from "@/components/pages/SiteMenuManager";


export default async function AdminMenuPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await searchParams;
  const [menuItems, pageOptions] = await Promise.all([getSiteMenuItems(), getSiteMenuPageOptions()]);

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="mx-auto max-w-[1900px]">


        <div className="rounded-xl border-2 border-[#5858E2]/20 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6 lg:p-8">
          <h1 className="font-display text-xl font-bold text-gray-900 sm:text-2xl">Управление меню сайта</h1>

          <SiteMenuManager scope="admin" initialItems={menuItems} pageOptions={pageOptions} />
        </div>
      </div>
    </div>
  );
}
