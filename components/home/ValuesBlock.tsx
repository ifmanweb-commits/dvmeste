export function ValuesBlock() {
  const values = [
    {
      number: "01",
      title: "Абсолютная прозрачность",
      description: "Все дипломы, сертификаты, пройденные курсы и супервизии доступны для просмотра. Вы видите реальный бэкграунд психолога, а не общие фразы.",
      color: "#5858E2"
    },
    {
      number: "02", 
      title: "Многоэтапная проверка",
      description: "Документы → личное интервью → оценка практики. Каждый этап — фильтр. Только треть кандидатов проходит все стадии.",
      color: "#A7FF5A"
    },
    {
      number: "03",
      title: "Человечный подход",
      description: "Фильтры по реальным параметрам: цена, проблема, метод. И статьи от психологов — чтобы понять, как они мыслят.",
      color: "#5858E2"
    }
  ];

  return (
    <div className="bg-white py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        
        {               }
        <div className="mb-20">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px w-16 bg-[#5858E2]"></div>
            <div className="text-lg font-medium text-gray-900">Принципы, которые не нарушаем</div>
          </div>
          
          <h2 className="text-5xl font-bold text-gray-900 leading-tight">
            Почему наш реестр <br />
            <span className="text-[#5858E2]">вызывает доверие</span>
          </h2>
        </div>

        {                     }
        <div className="space-y-20">
          {values.map((value, index) => (
            <div key={index} className="relative">
              {                 }
              <div className="absolute -left-8 top-0 text-8xl font-bold text-gray-900/10">
                {value.number}
              </div>
              
              {                                  }
              <div className="flex items-center gap-4 mb-6">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: value.color }}
                ></div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {value.title}
                </h3>
              </div>
              
              {              }
              <p className="text-lg text-gray-700 leading-relaxed max-w-3xl">
                {value.description}
              </p>
              
              {                 }
              {index < values.length - 1 && (
                <div className="mt-20 h-px bg-[#BFBFBF]"></div>
              )}
            </div>
          ))}
        </div>

        {                   }
        <div className="mt-24 pt-8 border-t border-[#BFBFBF]">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Эти принципы не обсуждаются
            </div>
            <div className="text-sm font-medium text-[#5858E2]">
              Работаем так с 2021 года
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}