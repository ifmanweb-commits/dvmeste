import Link from "next/link";

interface Author {
  id: string;
  slug: string;
  fullName: string;
  certificationLevel?: number;
  shortBio?: string;
  images?: string[];
}

export function ArticleAuthorBadge({ author }: { author: Author }) {
  const mainImage = author.images?.[0];
  return (
    <aside className="mt-8 rounded-2xl border border-neutral-light/80 bg-white/70 p-6">
      <h2 className="font-display text-lg font-semibold text-foreground mb-2">Автор статьи</h2>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {mainImage && mainImage !== "" ? (
          <img
            src={mainImage}
            alt={author.fullName}
            className="h-24 w-24 rounded-2xl object-cover border border-neutral-200"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-neutral-light/50 text-neutral-dark border border-neutral-200">
            Нет фото
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-display font-semibold text-foreground">{author.fullName}</p>
          {author.certificationLevel && (
            <p className="mt-1 text-sm text-[#5858E2]">Уровень сертификации: {author.certificationLevel}</p>
          )}
          {author.shortBio && (
            <p className="mt-2 text-sm leading-relaxed text-neutral-dark line-clamp-3">{author.shortBio}</p>
          )}
          <Link href={`/psy-list/${author.slug}`} className="mt-4 inline-block">
            <span className="rounded-xl bg-[#5858E2] px-6 py-2 font-medium text-white hover:bg-[#4848d0] shadow-md transition-all text-sm">На страницу психолога</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
