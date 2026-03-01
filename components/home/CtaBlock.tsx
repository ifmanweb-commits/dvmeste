import Link from "next/link";

                                    
export function CtaBlock() {
  return (
    <section className="border-t-4 border-[#A7FF5A] bg-[#F5F5F7] px-4 py-10 sm:px-6 sm:py-14 md:px-8 lg:px-12">
      <div className="mx-auto max-w-4xl rounded-xl border-4 border-[#5858E2]/30 bg-[#5858E2] px-4 py-10 text-center shadow-xl sm:rounded-2xl sm:px-6 sm:py-12 md:px-10 md:py-14">
        <h2 className="font-display text-xl font-bold text-white sm:text-2xl md:text-3xl">
          Найди своего психолога
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-white/90 sm:mt-4 sm:text-base md:text-lg">
          Открой каталог, задай фильтры по подходу, цене и уровню — выбери специалиста.
        </p>
        <div className="mt-6 sm:mt-8">
          <Link href="/psy-list" className="inline-block rounded-xl bg-[#A7FF5A] px-5 py-2.5 text-sm font-semibold text-foreground shadow-lg hover:bg-[#8ee64a] sm:px-6 sm:py-3 sm:text-base">
            Подобрать психолога
          </Link>
        </div>
        <p className="mt-6 text-xs text-white/80 sm:mt-8 sm:text-sm">
          Вопросы: <a href="https://t.me/psy_smirnov" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">Telegram @psy_smirnov</a>
          {" · "}
          <Link href="/contacts" className="underline hover:no-underline">Контакты</Link>
        </p>
      </div>
    </section>
  );
}
