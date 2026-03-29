interface ProblematicLeadsData {
  noResponseOver2Days: number;
  noProgressOver10Days: number;
}

interface ProblematicLeadsProps {
  data: ProblematicLeadsData;
}

export function ProblematicLeads({ data }: ProblematicLeadsProps) {
  const hasAnyProblems = data.noResponseOver2Days > 0 || data.noProgressOver10Days > 0;

  if (!hasAnyProblems) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <h2 className="text-lg font-semibold text-blue-900 mb-4">
        🔵 Проблемные заявки
      </h2>
      <div className="space-y-3">
        {data.noResponseOver2Days > 0 && (
          <a
            href="/admin/leads?status=NEW&old=2days"
            className="flex items-center justify-between bg-white border border-blue-200 rounded-lg p-4 hover:bg-blue-50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-blue-600 group-hover:text-blue-700">
                {data.noResponseOver2Days}
              </span>
              <span className="text-blue-800">
                Нет ответа более 2 дней
              </span>
            </div>
            <span className="text-blue-600 group-hover:text-blue-800">→</span>
          </a>
        )}
        {data.noProgressOver10Days > 0 && (
          <a
            href="/admin/leads?status=ACCEPTED&old=10days"
            className="flex items-center justify-between bg-white border border-blue-200 rounded-lg p-4 hover:bg-blue-50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-blue-600 group-hover:text-blue-700">
                {data.noProgressOver10Days}
              </span>
              <span className="text-blue-800">
                Нет прогресса более 10 дней
              </span>
            </div>
            <span className="text-blue-600 group-hover:text-blue-800">→</span>
          </a>
        )}
      </div>
    </div>
  );
}