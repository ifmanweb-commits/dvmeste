import Link from "next/link";
import { getSiteMenuItems, getSiteMenuPageOptions } from "@/lib/site-menu";
import { SiteMenuManager } from "@/components/pages/SiteMenuManager";
import HorNav from "../management/HorNav";


export default async function AdminMenuPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await searchParams;
  const [menuItems, pageOptions] = await Promise.all([getSiteMenuItems(), getSiteMenuPageOptions()]);

  return (
    <div className="">
      <div className="mx-auto max-w-[1900px]">


        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Управление меню сайта</h1>
          <p className="text-gray-500 mt-1">Настройка навигации по сайту</p>

          {/* Вкладки */}
          <HorNav />
        </div>

        <div className="mt-6">
          <SiteMenuManager scope="admin" initialItems={menuItems} pageOptions={pageOptions} />
        </div>
        
      </div>
    </div>
  );
}
