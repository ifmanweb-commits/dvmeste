"use client";

import { useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui";
import { buildCatalogUrl } from "@/lib/url";
import { normalizeImageSrc, isExternalImageSrc } from "@/lib/image-src";
import type { PsychologistCatalogItem } from "@/types/catalog";
import { useRouter } from "next/navigation";

type Props = {
  items: PsychologistCatalogItem[];
  nextCursor: string | null;
  hasMore: boolean;
  searchParams: Record<string, string | string[] | undefined>;
};

   
                                
                                                      
   
export function CatalogWithModal({ items, nextCursor, hasMore, searchParams }: Props) {
  const router = useRouter();

                                               
  const goToPsychologist = useCallback((psychologist: PsychologistCatalogItem) => {
    router.push(`/psy-list/${psychologist.slug}`);
  }, [router]);

  const nextUrl = nextCursor != null ? buildCatalogUrl(searchParams, { cursor: nextCursor }) : null;

  return (
    <div className="min-h-[60vh]">
      {items.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center sm:rounded-2xl sm:p-12">
          <p className="font-display text-base font-semibold text-foreground sm:text-lg">
            По заданным фильтрам никого не найдено
          </p>
          <p className="mt-2 text-xs text-neutral-dark sm:text-sm">Попробуйте ослабить условия поиска</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 items-stretch gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:gap-7">
            {items.map((p) => (
              <CardBlock
                key={p.id}
                psychologist={p}
                onClick={() => goToPsychologist(p)}
              />
            ))}
          </div>
          {hasMore && nextUrl && (
            <div className="mt-6 flex justify-center sm:mt-10">
              <Link
                href={nextUrl}
                className="inline-block rounded-xl bg-[#5858E2] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#4848d0] sm:px-8 sm:py-3 sm:text-base"
              >
                Показать ещё
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}

                                                                      
function CardBlock({
  psychologist,
  onClick,
}: {
  psychologist: PsychologistCatalogItem;
  onClick: () => void;
}) {
  const { fullName, city, mainParadigm, certificationLevel, shortBio, price, images, educationCount, coursesCount } = psychologist;
  const visibleParadigms = mainParadigm.slice(0, 2);
  const paradigmsOverflow = Math.max(0, mainParadigm.length - visibleParadigms.length);
  const rawImage = images[0] ?? null;
  const imageSrc = rawImage ? normalizeImageSrc(rawImage) : null;
  const unoptimized = rawImage ? isExternalImageSrc(rawImage) : false;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white p-0 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#5858E2]/35 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#5858E2]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#F5F5F7] lg:aspect-[7/5]">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={fullName}
            fill
            className="object-cover"
            sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
            unoptimized={unoptimized}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-500">Нет фото</div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="line-clamp-2 font-display text-xl font-semibold text-foreground transition-colors group-hover:text-[#5858E2]">
          {fullName}
        </h3>
        <p className="mt-2 inline-flex w-fit items-center rounded-full bg-[#A7FF5A] px-2.5 py-0.5 text-xs font-bold text-[#111a33]">
          Уровень квалификации: {certificationLevel}
        </p>
        <p className="mt-2 text-sm text-neutral-dark">
          {city || "Город не указан"} · Дипломов: {educationCount} · Курсов: {coursesCount}
        </p>
        <div className="mt-2 flex min-h-8 flex-wrap gap-1.5">
          {visibleParadigms.map((p) => (
            <Badge key={p} variant="primary">
              {p}
            </Badge>
          ))}
          {paradigmsOverflow > 0 && (
            <Badge variant="primary">+{paradigmsOverflow}</Badge>
          )}
        </div>
        <p className="mt-3 line-clamp-3 text-base leading-relaxed text-foreground">{shortBio}</p>

        <div className="mt-auto pt-4">
          <p className="text-xl font-bold text-[#5858E2] sm:text-xl">{price} ₽ / сессия</p>
          <span className="mt-1.5 inline-block text-base font-semibold text-[#5858E2] group-hover:underline">
            Подробнее →
          </span>
        </div>
      </div>
    </button>
  );
}
