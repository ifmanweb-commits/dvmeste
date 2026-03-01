import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="font-display text-4xl font-bold tracking-tighter text-foreground md:text-5xl">
        404
      </h1>
      <p className="mt-4 text-lg text-neutral-dark">
        Такой страницы нет. Возможно, её удалили или адрес указан с ошибкой.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#5858E2] px-6 py-3 font-medium text-white transition hover:bg-[#4848d0]"
      >
        На главную
      </Link>
      <p className="mt-6">
        <Link href="/psy-list" className="text-[#5858E2] underline hover:no-underline">
          Каталог психологов
        </Link>
        {" · "}
        <Link href="/contacts" className="text-[#5858E2] underline hover:no-underline">
          Контакты
        </Link>
      </p>
    </div>
  );
}
