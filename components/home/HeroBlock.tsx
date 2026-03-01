import Image from "next/image";
import Link from "next/link";

                                                                                                                              
export function HeroBlock() {
  return (
    <section className="relative overflow-hidden border-b-4 border-[#5858E2] bg-[#F5F5F7] px-4 py-10 sm:px-6 sm:py-16 md:px-8 md:py-20 lg:px-12">
      <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#A7FF5A]/30 blur-3xl sm:h-64 sm:w-64" aria-hidden />
      <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-[#5858E2]/20 blur-3xl sm:h-48 sm:w-48" aria-hidden />
      <div className="relative mx-auto max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div className="min-w-0">
            <span className="inline-block rounded-full bg-[#A7FF5A] px-3 py-1 text-xs font-semibold text-foreground sm:px-4 sm:py-1.5 sm:text-sm">
              Реестр психологов
            </span>
            <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground sm:mt-4 sm:text-3xl md:text-4xl lg:text-5xl">
              Находим своего психолога вместе
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-neutral-dark sm:mt-5 sm:text-base md:text-lg">
              «Давай вместе» — реестр психологов с прозрачной сертификацией. Подбор по подходу, цене, городу и уровню подготовки. Образование и дипломы видны в каждой анкете.
            </p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-dark sm:mt-3 sm:text-base md:text-lg">
              Мы не продаём консультации — помогаем найти специалиста, с которым будет комфортно и безопасно работать.
            </p>
            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-medium text-foreground sm:mt-6 sm:gap-x-6 sm:gap-y-2 sm:text-sm md:text-base">
              <li className="flex items-center gap-1.5 sm:gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#A7FF5A] sm:h-2 sm:w-2" /> Фильтры по цене, методу, городу
              </li>
              <li className="flex items-center gap-1.5 sm:gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#A7FF5A] sm:h-2 sm:w-2" /> Три уровня сертификации
              </li>
              <li className="flex items-center gap-1.5 sm:gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#A7FF5A] sm:h-2 sm:w-2" /> Дипломы и курсы в каждой анкете
              </li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3 sm:mt-8 sm:gap-4">
              <Link
                href="/psy-list"
                className="inline-block rounded-xl bg-[#5858E2] px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-[#4848d0] sm:px-6 sm:py-3.5 sm:text-base"
              >
                Подобрать психолога
              </Link>
              <Link
                href="/certification-levels"
                className="inline-block rounded-xl border-2 border-[#5858E2] px-4 py-2.5 text-sm font-semibold text-[#5858E2] hover:bg-[#5858E2] hover:text-white sm:px-5 sm:py-3 sm:text-base"
              >
                Уровни сертификации
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] min-h-[220px] overflow-hidden rounded-xl border-4 border-[#A7FF5A] bg-white shadow-xl sm:aspect-[16/11] sm:min-h-[260px] sm:rounded-2xl lg:aspect-[4/3] lg:min-h-[320px] xl:aspect-[16/11] xl:min-h-[360px]">
            <Image
              src="/images/hero.png"
              alt="Подбор психолога: карточки специалистов"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 92vw, (max-width: 1536px) 46vw, 620px"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
