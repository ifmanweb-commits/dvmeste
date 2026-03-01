import Link from "next/link";
import { getPageBySlug } from "@/lib/page-content";
import { buildMetadata } from "@/lib/seo";
import { PageContent } from "@/components/PageContent";

export const metadata = buildMetadata({
  title: "Библиотека — Давай вместе",
  description: "Тематические статьи и материалы по психологии и психотерапии. Сервис «Давай вместе».",
  path: "/lib",
});

export default async function LibPage() {
  const page = await getPageBySlug("lib");

  if (page) {
    return <PageContent title={page.title} template={page.template} content={page.content} />;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold tracking-tighter text-foreground md:text-4xl">
        Библиотека
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-neutral-dark">
        Подборка статей и материалов от психологов реестра. Содержимое раздела можно задать в админке: «Страницы сайта» → создать страницу со slug <strong>lib</strong> и включить «Опубликовать».
      </p>
      <nav className="mt-8">
        <Link
          href="/lib/articles"
          className="inline-flex items-center gap-2 rounded-xl bg-[#5858E2] px-5 py-3 font-medium text-white transition hover:bg-[#4848d0]"
        >
          Перейти к статьям
        </Link>
      </nav>
      <p className="mt-8">
        <Link href="/" className="text-[#5858E2] underline hover:no-underline">
          ← На главную
        </Link>
      </p>
    </div>
  );
}
