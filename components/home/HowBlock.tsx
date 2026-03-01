import Link from "next/link";

                               
export function HowBlock() {
  const steps = [
    { num: 1, title: "Задайте фильтры", text: "Парадигма, цена, город, уровень сертификации. Сортировка по цене или уровню." },
    { num: 2, title: "Смотрите карточки", text: "Фото, краткое «о себе», метод, уровень, дипломы и курсы. «Подробнее» — полная анкета с образованием и контактами." },
    { num: 3, title: "Свяжитесь со специалистом", text: "Контакты в анкете. Дальнейшее общение — напрямую с психологом. Мы не ведём запись и не берём комиссию." },
  ];

  return (
    <section className="border-t border-neutral-200 bg-white px-4 py-10 sm:px-6 sm:py-14 md:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
          Как это работает
        </h2>
        <p className="mt-2 text-sm text-neutral-dark sm:mt-3 sm:text-base md:text-lg">
          Подбор в три шага: фильтры → карточки → контакт. Бесплатно для клиента.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-3 sm:gap-6">
          {steps.map((step) => (
            <div key={step.num} className="flex flex-col rounded-xl border border-neutral-200 bg-[#F5F5F7] p-4 sm:p-5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#5858E2] font-display text-base font-bold text-white shadow-md sm:h-10 sm:w-10 sm:text-lg">
                {step.num}
              </span>
              <h3 className="mt-2 font-display text-base font-semibold text-foreground sm:mt-3 sm:text-lg">{step.title}</h3>
              <p className="mt-1.5 flex-1 text-xs leading-relaxed text-neutral-dark sm:mt-2 sm:text-sm">{step.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center sm:mt-8">
          <Link href="/psy-list" className="inline-block rounded-xl border border-[#5858E2] px-4 py-2.5 text-sm font-semibold text-[#5858E2] hover:bg-[#5858E2] hover:text-white sm:px-5 sm:py-2.5 sm:text-base">
            Открыть каталог
          </Link>
        </div>
      </div>
    </section>
  );
}
