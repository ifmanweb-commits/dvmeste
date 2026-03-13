import Image from "next/image";
import Link from "next/link";

                                           
export function ForPsychologistsBlock() {
  return (
    <section className="border-t border-neutral-200 bg-white px-4 py-10 sm:px-6 sm:py-16 md:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
              Для психологов
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-neutral-dark sm:mt-4 sm:text-base md:text-lg">
              Реестр «Давай вместе» — возможность быть видимым для клиентов с понятными критериями сертификации. Анкета в каталоге с фильтрами, статьи в библиотеке с авторством и ссылкой на анкету.
            </p>
            <p className="mt-4 text-sm text-neutral-dark sm:mt-6 sm:text-base">
              Как попасть в реестр и что нужно — в разделе «Для психологов». Там же — про уровни сертификации и порядок вступления.
            </p>
            <p className="mt-2 text-xs text-neutral-dark sm:text-sm">
              Реестр даёт видимость для клиентов, которые ищут проверенных специалистов с понятными критериями.
            </p>
            <div className="mt-6 sm:mt-10">
              <Link href="/connect" className="inline-block rounded-xl border-2 border-[#5858E2] px-4 py-2.5 text-sm font-semibold text-[#5858E2] hover:bg-[#5858E2] hover:text-white sm:px-6 sm:py-3 sm:text-base">
                Подробнее для психологов
              </Link>
            </div>
            <p className="mt-4 text-xs text-neutral-dark sm:text-sm">
              Уровни сертификации: <Link href="/certification-levels" className="text-[#5858E2] underline hover:no-underline">что это и как пройти</Link>
            </p>
          </div>
          <div className="relative h-52 w-full shrink-0 overflow-hidden rounded-xl border-2 border-[#A7FF5A]/50 bg-[#F5F5F7] sm:h-60 lg:h-64 lg:w-80 xl:h-72 xl:w-[360px] 2xl:h-80 2xl:w-[400px]">
            <Image
              src="/images/image-doctor.png"
              alt="Для психологов: присоединиться к реестру"
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 92vw, (max-width: 1280px) 320px, (max-width: 1536px) 360px, 400px"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
