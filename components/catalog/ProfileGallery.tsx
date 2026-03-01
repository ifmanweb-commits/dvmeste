"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { normalizeImageSrc, isExternalImageSrc } from "@/lib/image-src";

type ProfileGalleryProps = {
  images: string[];
  fullName: string;
};

export function ProfileGallery({ images, fullName }: ProfileGalleryProps) {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const validImages = images.filter((s) => s && s.trim() !== "");
  const totalImages = validImages.length;

  const goPrev = useCallback(() => {
    if (totalImages === 0) return;
    setCurrent((c) => (c === 0 ? totalImages - 1 : c - 1));
  }, [totalImages]);
  const goNext = useCallback(() => {
    if (totalImages === 0) return;
    setCurrent((c) => (c === totalImages - 1 ? 0 : c + 1));
  }, [totalImages]);

  if (totalImages === 0) {
    return (
      <div className="flex h-64 w-full shrink-0 items-center justify-center rounded-2xl bg-[#F5F5F7] text-neutral sm:h-72 sm:w-56">
        Нет фото
      </div>
    );
  }

  const rawSrc = validImages[current];
  const currentSrc = normalizeImageSrc(rawSrc);
  const isExternal = isExternalImageSrc(rawSrc);

  return (
    <>
      <div className="w-full shrink-0 sm:w-56">
        <div
          className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#F5F5F7] sm:aspect-[3/4] sm:h-72 sm:w-56"
          role="img"
          aria-label={`Фото ${current + 1} из ${totalImages}`}
        >
          <Image
            src={currentSrc}
            alt={`${fullName} — фото ${current + 1}`}
            fill
            className="cursor-zoom-in object-cover"
            sizes="(max-width: 640px) 100vw, 224px"
            priority
            unoptimized={isExternal}
            onClick={() => setLightbox(true)}
          />
        </div>
        {totalImages > 1 && (
          <div className="mt-2 flex items-center justify-between gap-2">
            <button type="button" onClick={goPrev} className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium" aria-label="Предыдущее фото">
              ←
            </button>
            <span className="text-sm text-neutral-dark">{current + 1} / {totalImages}</span>
            <button type="button" onClick={goNext} className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium" aria-label="Следующее фото">
              →
            </button>
          </div>
        )}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Увеличить фото"
          onClick={() => setLightbox(false)}
        >
          <button type="button" className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/30" onClick={() => setLightbox(false)} aria-label="Закрыть">
            ✕
          </button>
          {totalImages > 1 && (
            <>
              <button type="button" className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white hover:bg-white/30" onClick={(e) => { e.stopPropagation(); goPrev(); }} aria-label="Предыдущее фото">←</button>
              <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white hover:bg-white/30" onClick={(e) => { e.stopPropagation(); goNext(); }} aria-label="Следующее фото">→</button>
            </>
          )}
          <div className="relative max-h-full max-w-full" onClick={(e) => e.stopPropagation()}>
          <Image
            src={currentSrc}
            alt={`${fullName} — фото ${current + 1}`}
            width={1200}
            height={900}
            className="max-h-[90vh] w-auto object-contain"
            unoptimized={isExternal}
            sizes="100vw"
          />
          </div>
        </div>
      )}
    </>
  );
}
