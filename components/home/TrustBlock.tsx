import Image from "next/image";

export function TrustBlock() {
  const trustPoints = [
    {
      title: "Многоэтапный отбор",
      description: "Анкетирование + интервью + проверка документов + оценка уровня",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      title: "Проверенные дипломы",
      description: "Все образовательные документы проходят ручную проверку",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      title: "Супервизия и терапия",
      description: "Обязательная личная терапия и регулярная супервизия",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    }
  ];

  return (
    <section className="bg-gradient-to-b from-white to-gray-50/30 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {                          }
        <div className="mb-10 text-center md:mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#5858E2]/20 bg-white px-4 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5858E2] animate-pulse"></span>
            <span className="text-sm font-semibold text-[#5858E2]">Доверие и гарантии</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Почему наш реестр — 
            <span className="text-[#5858E2]"> знак качества</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-gray-600 md:text-lg">
            Строгие критерии, проверенные специалисты и постоянный контроль
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-5 lg:gap-10">
          
          {                             }
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-gradient-to-br from-[#5858E2] to-[#5858E2]/90 p-6 text-white md:p-8">
              <h3 className="mb-6 text-lg font-semibold md:text-xl">Наши показатели</h3>
              
              <div className="space-y-6">
                <div className="border-b border-white/20 pb-6">
                  <div className="text-3xl font-bold md:text-4xl">50+</div>
                  <div className="mt-1 text-white/90">специалистов в реестре</div>
                  <div className="mt-2 text-sm text-white/70">
                    От психологов-стажеров до экспертов с опытом 10+ лет
                  </div>
                </div>

                <div className="border-b border-white/20 pb-6">
                  <div className="flex items-center gap-2">
                    <div className="text-3xl font-bold md:text-4xl">3</div>
                    <div className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
                      уровня сертификации
                    </div>
                  </div>
                  <div className="mt-1 text-white/90">четкая система оценки</div>
                  <div className="mt-2 text-sm text-white/70">
                    От базового до экспертного уровня по единым стандартам
                  </div>
                </div>

                <div>
                  <div className="text-3xl font-bold md:text-4xl">100%</div>
                  <div className="mt-1 text-white/90">проверенных документов</div>
                  <div className="mt-2 text-sm text-white/70">
                    Дипломы, сертификаты, личная терапия — всё проверяется
                  </div>
                </div>
              </div>
            </div>
          </div>

          {                                     }
          <div className="lg:col-span-3">
            <div className="grid gap-6">
              {trustPoints.map((point, index) => (
                <div 
                  key={index}
                  className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-[#5858E2]/40 hover:shadow-md md:p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#5858E2]/10 text-[#5858E2]">
                      {point.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{point.title}</h3>
                      <p className="mt-1.5 text-gray-600">{point.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {                               }
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-[#A7FF5A]/10 border border-[#A7FF5A]/30 p-4">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">Ежеквартальный контроль</span>
                </div>
                <p className="mt-2 text-xs text-gray-600">
                  Проверяем актуальность данных и собираем отзывы клиентов
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-[#5858E2]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">Гарантия качества</span>
                </div>
                <p className="mt-2 text-xs text-gray-600">
                  Каждый психолог отвечает нашим строгим профессиональным стандартам
                </p>
              </div>
            </div>

            {                       }
            <div className="mt-6 rounded-xl bg-gradient-to-r from-gray-50 to-white p-5 border border-gray-200">
              <p className="text-center text-sm font-medium text-gray-900">
                <span className="text-[#5858E2]">✓</span> Выбирайте проверенных специалистов с гарантией качества
              </p>
            </div>
          </div>

        </div>

        {                                               }
    

<div className="mt-10">
  <div className="relative overflow-hidden rounded-2xl mx-auto max-w-6xl">
    <div className="aspect-[4/3] sm:aspect-[16/6.5] lg:aspect-[16/4.5]"> {                                 }
      <Image
        src="/images/image-5.jpg"
        alt="Профессиональная психологическая консультация в доверительной обстановке"
        fill
        className="object-cover"
        sizes="(max-width: 640px) 100vw, (max-width: 768px) 95vw, (max-width: 1024px) 90vw, (max-width: 1536px) 72vw, 60vw"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent sm:bg-gradient-to-r sm:from-black/30 sm:via-black/10 sm:to-transparent"></div>
      
      <div className="absolute inset-0 flex items-end sm:items-center">
        <div className="px-4 py-6 sm:px-8 sm:py-10 lg:px-12 lg:py-16 w-full">
          <div className="max-w-full sm:max-w-2xl lg:max-w-3xl">
            <div className="mb-3 inline-block rounded-full bg-white/20 px-3 py-1 sm:px-4 sm:py-1.5 lg:px-5 lg:py-2 backdrop-blur-sm">
              <span className="text-xs sm:text-sm lg:text-base font-medium text-green-400">Доверие</span>
            </div>
            <h3 className="text-xl font-bold text-white sm:text-2xl lg:text-4xl">
              Профессионализм, проверенный временем
            </h3>
            <p className="mt-2 text-white/90 text-sm sm:text-base lg:text-lg">
              Наши психологи проходят строгий отбор и регулярно повышают квалификацию
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

</div>
    </section>
  );
}
