import Link from "next/link";
import { buildMetadata } from "@/lib/seo";



export const metadata = buildMetadata({
  title: "Админ-панель",
  path: "/admin",
  noIndex: true,
});

   
                                   
   
export default function AdminPage() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
      <h1 className="font-display text-2xl font-bold text-foreground">
        Админ-панель
      </h1>
      <p className="mt-4 text-neutral-dark">
        Управление контентом сайта «Давай вместе».
      </p>
      <ul className="mt-8 space-y-4">
        <li>
          <Link
            href="/admin/profile"
            className="block rounded-xl border border-neutral-200 bg-[#F5F5F7] p-4 font-medium text-foreground hover:border-[#5858E2] hover:bg-[#5858E2]/5"
          >
            Профиль супер-админа — логин, почта, пароль, восстановление
          </Link>
        </li>
        <li>
          <Link
            href="/admin/psychologists"
            className="block rounded-xl border border-neutral-200 bg-[#F5F5F7] p-4 font-medium text-foreground hover:border-[#5858E2] hover:bg-[#5858E2]/5"
          >
            Психологи — добавить, редактировать, удалить анкеты
          </Link>
        </li>
        <li>
          <Link
            href="/admin/pages"
            className="block rounded-xl border border-neutral-200 bg-[#F5F5F7] p-4 font-medium text-foreground hover:border-[#5858E2] hover:bg-[#5858E2]/5"
          >
            Страницы сайта — создать или изменить страницы (текст или свой HTML)
          </Link>
        </li>

        <li>
          <Link
            href="/admin/managers"
            className="block rounded-xl border border-neutral-200 bg-[#F5F5F7] p-4 font-medium text-foreground hover:border-[#5858E2] hover:bg-[#5858E2]/5"
          >
            Менеджеры - менеджеры, добавление, удаление, управление
          </Link>
        </li>

          <li>
          <Link
            href="/admin/ListDate"
            className="block rounded-xl border border-neutral-200 bg-[#F5F5F7] p-4 font-medium text-foreground hover:border-[#5858E2] hover:bg-[#5858E2]/5"
          >
            Список данных
          </Link>
        </li>

            <li>
          <Link
            href="/admin/articles"
            className="block rounded-xl border border-neutral-200 bg-[#F5F5F7] p-4 font-medium text-foreground hover:border-[#5858E2] hover:bg-[#5858E2]/5"
          >
            Статьи (библиотека)
          </Link>
        </li>
      </ul>
    </div>
  );
}
