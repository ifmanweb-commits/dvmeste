interface PsychologistsStatsProps {
  data: {
    total: number;
    notVerified: number;
    verified: number;
    inCatalog: number;
    level1: number;
    level2: number;
    level3: number;
  };
  students: {
    enrolled: number;
    graduated: number;
  };
}

export function PsychologistsStats({ data, students }: PsychologistsStatsProps) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6">
      <h2 className="text-xl font-semibold mb-4">Психологи</h2>
      
      {/* Основная статистика */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-3xl font-bold text-blue-600">{data.total}</div>
          <div className="text-sm text-blue-800 mt-1">Всего психологов</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-3xl font-bold text-green-600">{data.inCatalog}</div>
          <div className="text-sm text-green-800 mt-1">В каталоге</div>
        </div>
      </div>

      {/* Две колонки: Уровни сертификации + Наши ученики */}
      <div className="grid grid-cols-2 gap-4">
        {/* Уровни сертификации */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">Уровни сертификации</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 text-right w-1/2 pr-2">Первого уровня</span>
              <span className="text-base font-semibold text-gray-900 text-left w-1/2 pl-2">{data.level1}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 text-right w-1/2 pr-2">Второго уровня</span>
              <span className="text-base font-semibold text-gray-900 text-left w-1/2 pl-2">{data.level2}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 text-right w-1/2 pr-2">Третьего уровня</span>
              <span className="text-base font-semibold text-gray-900 text-left w-1/2 pl-2">{data.level3}</span>
            </div>
            <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200">
              <span className="text-sm font-semibold text-gray-700 text-right w-1/2 pr-2">Всего проверено</span>
              <span className="text-base font-bold text-green-600 text-left w-1/2 pl-2">{data.verified}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm font-semibold text-gray-700 text-right w-1/2 pr-2">Не проверено</span>
              <span className="text-base font-bold text-amber-600 text-left w-1/2 pl-2">{data.notVerified}</span>
            </div>
          </div>
        </div>

        {/* Наши ученики */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">Наши ученики</h3>
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-2xl font-bold text-blue-600 text-center">{students.enrolled}</div>
              <div className="text-xs text-gray-600 text-center mt-1">Учеников</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-2xl font-bold text-green-600 text-center">{students.graduated}</div>
              <div className="text-xs text-gray-600 text-center mt-1">Выпускников</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
