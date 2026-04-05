interface StatisticsBlockProps {
  data: {
    newPsychologists: {
      thisMonth: number;
      thisWeek: number;
      today: number;
    };
    clients: {
      total: number;
      thisMonth: number;
      thisWeek: number;
      today: number;
    };
  };
}

export function StatisticsBlock({ data }: StatisticsBlockProps) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6">
      <h2 className="text-xl font-semibold mb-4">Статистика</h2>
      
      <div className="space-y-6">
        {/* Новых регистраций психологов */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">Новых регистраций психологов</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 text-right w-1/2 pr-2">За этот месяц (с 1 числа)</span>
              <span className="text-base font-semibold text-gray-900 text-left w-1/2 pl-2">{data.newPsychologists.thisMonth}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 text-right w-1/2 pr-2">За эту неделю (с понедельника)</span>
              <span className="text-base font-semibold text-gray-900 text-left w-1/2 pl-2">{data.newPsychologists.thisWeek}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 text-right w-1/2 pr-2">За сегодня</span>
              <span className="text-base font-semibold text-gray-900 text-left w-1/2 pl-2">{data.newPsychologists.today}</span>
            </div>
          </div>
        </div>

        {/* Клиентов на сайте */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">Клиентов на сайте</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 text-right w-1/2 pr-2">Заявок на сайте всего</span>
              <span className="text-base font-semibold text-gray-900 text-left w-1/2 pl-2">{data.clients.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 text-right w-1/2 pr-2">За этот месяц (с 1 числа)</span>
              <span className="text-base font-semibold text-gray-900 text-left w-1/2 pl-2">{data.clients.thisMonth}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 text-right w-1/2 pr-2">За эту неделю (с понедельника)</span>
              <span className="text-base font-semibold text-gray-900 text-left w-1/2 pl-2">{data.clients.thisWeek}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 text-right w-1/2 pr-2">За сегодня</span>
              <span className="text-base font-semibold text-gray-900 text-left w-1/2 pl-2">{data.clients.today}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}