import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleBySlug } from "@/lib/articles";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui";
import { buildMetadata } from "@/lib/seo";
import { normalizeImageSrc, isExternalImageSrc } from "@/lib/image-src";
import { normalizeEmbeddedLocalAssetUrls } from "@/lib/html-local-assets";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article)
    return buildMetadata({ title: "Статья", path: `/articles${slug}` });
  return buildMetadata({
    title: article.title,
    description: article.content.slice(0, 160).replace(/<[^>]+>/g, ""),
    path: `/articles${slug}`,
  });
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();
  const articleContent = normalizeEmbeddedLocalAssetUrls(article.content || "");

  const author = article.user;
  const mainImage = author?.images?.[0];

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <Link
        href="/articles"
        className="text-sm text-neutral-dark hover:text-[#5858E2]"
      >
        ← К списку статей
      </Link>

      {/* Белая подложка для статьи */}
      <article className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.3)] sm:p-8 lg:p-10">
        <h1 className="font-display text-3xl font-bold tracking-tighter text-foreground md:text-4xl">
          {article.title}
        </h1>
        
        {article.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {article.tags.map((t) => (
              <Badge key={t} variant="primary">
                {t}
              </Badge>
            ))}
          </div>
        )}
        
        {article.publishedAt && (
          <p className="mt-2 text-sm text-neutral-dark">
            {new Date(article.publishedAt).toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}

        <div
          className="mt-8 prose prose-neutral max-w-none text-foreground [&_a]:text-[#5858E2] [&_a]:underline [&_ul]:list-disc [&_ol]:list-decimal"
          dangerouslySetInnerHTML={{ __html: articleContent }}
        />
      </article>

      {author && (
        <aside className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.2)] sm:p-8">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Автор статьи
          </h2>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            {mainImage && mainImage !== "" ? (
              <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl">
                <Image
                  src={normalizeImageSrc(mainImage)}
                  alt={author.fullName}
                  fill
                  className="object-cover"
                  sizes="128px"
                  unoptimized={isExternalImageSrc(mainImage)}
                />
              </div>
            ) : (
              <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-2xl bg-neutral-light/50 text-neutral-dark">
                Нет фото
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-display font-semibold text-foreground">
                {author.fullName}
              </p>
              <p className="mt-1 text-sm text-[#5858E2]">
                Уровень сертификации: {author.certificationLevel}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-dark line-clamp-3">
                {author.shortBio}
              </p>
              <Link href={`/psy-list/${author.slug}`} className="mt-4 inline-block">
                <Button variant="primary">На страницу психолога</Button>
              </Link>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}