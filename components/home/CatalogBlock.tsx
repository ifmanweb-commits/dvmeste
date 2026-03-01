import Image from "next/image";
import Link from "next/link";

                                                                 
export function CatalogBlock() {
  const filters = [
    "Стоимость сессии (от и до)",
    "Метод работы (КПТ, гештальт и др.)",
    "Город и пол",
    "Уровень сертификации (1–3)",
    "Сортировка по цене или дате",
  ];

  return (
    <section className="relative overflow-hidden border-y-4 border-[#A7FF5A]/50 bg-[#F5F5F7] px-4 py-10 sm:px-6 sm:py-16 md:px-8 lg:px-12">
      <div className="absolute left-0 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-[#5858E2]/10 blur-3xl sm:h-72 sm:w-72" aria-hidden />
      <div className="relative mx-auto max-w-6xl">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl md:text-3xl lg:text-4xl">
              Подобрать психолога
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-neutral-dark sm:mt-4 sm:text-base md:text-lg">
              В каталоге — все психологи реестра. Задайте критерии, нажмите «Найти» — получите список анкет. У каждого указаны фото, краткое «о себе», метод, уровень, количество дипломов и курсов.
            </p>
            <div className="mt-6 rounded-xl border-2 border-[#5858E2]/30 bg-white/80 p-4 shadow-lg sm:mt-8 sm:rounded-2xl sm:p-6">
              <p className="font-semibold text-foreground sm:text-base">Фильтры каталога:</p>
              <ul className="mt-2 space-y-1.5 sm:mt-3 sm:space-y-2">
                {filters.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-neutral-dark sm:text-base">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#5858E2]" /> {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6 flex flex-wrap gap-3 sm:mt-10 sm:gap-4">
              <Link href="/psy-list" className="inline-block rounded-xl bg-[#5858E2] px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-[#4848d0] sm:px-6 sm:py-3.5 sm:text-base">
                Перейти в каталог
              </Link>
              <Link href="/certification-levels" className="inline-block rounded-xl border-2 border-[#A7FF5A] bg-[#A7FF5A]/20 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-[#A7FF5A]/40 sm:px-5 sm:py-3 sm:text-base">
                Что такое уровни?
              </Link>
            </div>
          </div>
          <div className="relative h-52 w-full shrink-0 overflow-hidden rounded-xl border-2 border-[#5858E2]/30 bg-white sm:h-60 lg:h-64 lg:w-96 xl:h-72 xl:w-[430px] 2xl:h-80 2xl:w-[460px]">
            <Image
              src="/images/image-4.JPG"
              alt="Каталог психологов: подбор по фильтрам"
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 92vw, (max-width: 1280px) 384px, (max-width: 1536px) 430px, 460px"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
