import Link from "next/link";
import { getPageBySlug } from "@/lib/page-content";
import { buildMetadata } from "@/lib/seo";
import { PageContent } from "@/components/PageContent";

export const metadata = buildMetadata({
  title: "Курсы — Давай вместе",
  description:
    "Образовательные курсы для психологов и интересующихся психотерапией. Сервис «Давай вместе».",
  path: "/courses",
});

export default async function CoursesPage() {
  const page = await getPageBySlug("courses");

  if (page) {
    return <PageContent title={page.title} template={page.template} content={page.content} />;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      
      <h1 className="font-display text-3xl font-bold tracking-tighter text-foreground md:text-4xl">
        Курсы
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-neutral-dark">
        Раздел с образовательными курсами для специалистов и всех, кто интересуется психотерапией. Содержимое можно добавить в админке: «Страницы сайта» → создать страницу со slug <strong>courses</strong> и включить «Опубликовать».
      </p>
      <p className="mt-6">
        <Link href="/" className="text-[#5858E2] underline hover:no-underline">
          ← На главную
        </Link>
      </p>

      

    </div>
  );
}
