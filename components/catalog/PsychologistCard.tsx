import Image from "next/image";
import Link from "next/link";
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
    workFormat,
  } = psychologist;

  const rawImage = images[0] ?? null;
  const imageSrc = rawImage ? normalizeImageSrc(rawImage) : null;
  const unoptimized = rawImage ? isExternalImageSrc(rawImage) : false;

  // Парсим модальности (workFormat может быть строкой типа "Онлайн, Офлайн")
  const modalities = workFormat 
    ? workFormat.split(/[,\/]/).map(m => m.trim()).filter(Boolean)
    : [];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-all hover:border-[#5858E2]/30">
      <div className="flex flex-col sm:flex-row min-h-[280px]">
        {/* Фото слева */}
        <div className="relative w-full sm:w-[200px] md:w-[240px] shrink-0 bg-gray-100">
          <div className="aspect-square sm:aspect-auto sm:h-full">
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt={fullName}
                width={240}
                height={240}
                className="w-full h-full object-contain"
                sizes="(max-width: 640px) 100vw, 240px"
                unoptimized={unoptimized}
              />
            ) : (
              <div className="flex h-full min-h-[200px] items-center justify-center text-gray-400 text-sm">
                Нет фото
              </div>
            )}
          </div>
        </div>

        {/* Контент справа */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col">
          {/* Верхняя строка: имя + уровень + цена */}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-lg text-gray-900">
                  {fullName}
                </h3>
              </div>
              {/* Бейдж уровня квалификации */}
              <div className="mt-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#5858E2] text-white">
                  {certificationLevel} уровень квалификации
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{city || "Город не указан"}</p>
            </div>
            
            {/* Цена и бесплатная сессия - правый верхний угол */}
            <div className="text-right flex-shrink-0">
              <div className="font-bold text-lg text-[#5858E2]">
                Стоимость: {price ? `${price} ₽` : 'Договорная'}
              </div>
              <div className="mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#A7FF5A] text-gray-900">
                  Первая сессия — бесплатно
                </span>
              </div>
            </div>
          </div>

          {/* Статистика */}
          <p className="text-xs text-gray-500 mt-2">
            Дипломов: {educationCount} · Курсов: {coursesCount}
          </p>

          {/* Краткое описание */}
          <div className="mt-2 text-sm text-gray-600 line-clamp-2 flex-1">
            {shortBio}
          </div>
          <Link
            href={`/catalog/${slug}`}
            className="text-sm font-medium text-[#5858E2] hover:underline"
          >
            Подробнее
          </Link>

          {/* Нижняя строка: кнопки + модальности */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-gray-100">
            {/* Парадигмы */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {mainParadigm.slice(0, 3).map((p) => (
                <Badge key={p} variant="primary">
                  {p}
                </Badge>
              ))}
            </div>
            {/* Модальности слева */}
            <div className="flex flex-wrap gap-1.5">
              {modalities.map((m, i) => (
                <span 
                  key={i}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                >
                  {m}
                </span>
              ))}
            </div>
            
            {/* Кнопки справа */}
            <div className="flex items-center gap-3">
              
              <button
                type="button"
                className="px-4 py-2 bg-[#5858E2] text-white text-sm font-medium rounded-xl hover:bg-[#4b4bcf] transition-colors"
              >
                Связаться
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
