import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui";
import { Badge } from "@/components/ui";
import { normalizeImageSrc, isExternalImageSrc } from "@/lib/image-src";
import type { PsychologistCatalogItem } from "@/types/catalog";

export interface PsychologistCardProps {
  psychologist: PsychologistCatalogItem;
}

export function PsychologistCard({ psychologist }: PsychologistCardProps) {
  const {
    slug,
    fullName,
    city,
    mainParadigm,
    certificationLevel,
    shortBio,
    price,
    images,
    educationCount,
    coursesCount,
  } = psychologist;

  
  const rawImage = images[0] ?? null;
  const imageSrc = rawImage ? normalizeImageSrc(rawImage) : null;
  const unoptimized = rawImage ? isExternalImageSrc(rawImage) : false;

  return (
    <Card glass padding="none" className="overflow-hidden">
      <Link href={`/psy-list/${slug}`} className="block">
        <div className="relative aspect-[4/3] w-full bg-background-subtle">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={fullName}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 340px"
              unoptimized={unoptimized}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-neutral font-sans text-sm">
              Нет фото
            </div>
          )}
          <div className="absolute right-3 top-3">
            <Badge variant="level" level={certificationLevel as 1 | 2 | 3} />
          </div>
        </div>
      </Link>
      <CardContent className="p-4">
        <Link href={`/psy-list/${slug}`} className="font-display font-semibold text-lg text-foreground hover:text-primary">
          {fullName}
        </Link>
        <p className="mt-1 text-sm text-neutral-dark">{city}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {mainParadigm.slice(0, 3).map((p) => (
            <Badge key={p} variant="primary">
              {p}
            </Badge>
          ))}
        </div>
        <p className="mt-2 text-xs text-neutral-dark">
          Дипломов: {educationCount} · Курсов: {coursesCount}
        </p>
        <p className="mt-3 line-clamp-3 text-sm text-foreground">{shortBio}</p>
      </CardContent>
      <CardFooter className="border-t border-neutral-light/80 p-4">
        <span className="font-display font-bold text-primary">{price} ₽</span>
        <span className="text-sm text-neutral"> / сессия</span>
        <Link
          href={`/psy-list/${slug}`}
          className="ml-auto font-display text-sm font-semibold text-primary hover:underline"
        >
          Подробнее
        </Link>
      </CardFooter>
    </Card>
  );
}
