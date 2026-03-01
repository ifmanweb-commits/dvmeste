import Image from "next/image";
import Link from "next/link";

                                         
export function LibraryBlock() {
  return (
    <section className="bg-[#F5F5F7] px-4 py-10 sm:px-6 sm:py-16 md:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
          <div className="relative h-56 w-full shrink-0 overflow-hidden rounded-xl border-2 border-[#5858E2]/20 bg-white sm:h-64 lg:order-2 lg:h-72 lg:w-80 xl:h-80 xl:w-[360px] 2xl:h-[22rem] 2xl:w-[400px]">
            <Image
              src="/images/image-3.jpg"
              alt="Библиотека статей от психологов"
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 92vw, (max-width: 1280px) 320px, (max-width: 1536px) 360px, 400px"
            />
          </div>
          <div className="min-w-0 flex-1 lg:order-1">
            <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
              Библиотека
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-neutral-dark sm:mt-4 sm:text-base md:text-lg">
              Тематические статьи от психологов реестра: не реклама, а материалы о психике, терапии и выборе специалиста. У каждой статьи указан автор — можно перейти на его анкету.
            </p>
            <p className="mt-2 text-xs text-neutral-dark sm:text-sm">
              Фильтр по тегам, хронологический порядок. Статьи помогают сориентироваться в подходах и темах до обращения к специалисту.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 sm:mt-10 sm:gap-4">
              <Link href="/lib" className="inline-block rounded-xl bg-[#5858E2] px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#4848d0] sm:px-6 sm:py-3 sm:text-base">
                В библиотеку
              </Link>
              <Link href="/lib/articles" className="inline-block rounded-xl border-2 border-[#A7FF5A] bg-[#A7FF5A]/20 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-[#A7FF5A]/40 sm:px-6 sm:py-3 sm:text-base">
                Все статьи
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
