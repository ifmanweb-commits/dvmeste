interface ArticleDebt {
  id: string;
  fullName: string | null;
  email: string;
  lastArticleDate: Date | null;
}

interface ArticleDebtsData {
  overdue: ArticleDebt[];
  atRisk: ArticleDebt[];
}

interface ArticleDebtsProps {
  data: ArticleDebtsData;
}

const formatDate = (date: Date | null) => {
  if (!date) return "Нет статей";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

export function ArticleDebts({ data }: ArticleDebtsProps) {
  const hasOverdue = data.overdue.length > 0;
  const hasAtRisk = data.atRisk.length > 0;

  if (!hasOverdue && !hasAtRisk) {
    return null;
  }

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-orange-900 mb-4">
        🟠 Долги по статьям
      </h2>

      {/* Просроченные */}
      {hasOverdue && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-orange-800 mb-2">
            Требуется статья ({data.overdue.length})
          </h3>
          <div className="bg-white border border-orange-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-orange-100">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-orange-900">ФИО</th>
                  <th className="px-4 py-2 text-left font-medium text-orange-900">Email</th>
                  <th className="px-4 py-2 text-left font-medium text-orange-900">Последняя статья</th>
                  <th className="px-4 py-2 text-left font-medium text-orange-900">Действие</th>
                </tr>
              </thead>
              <tbody>
                {data.overdue.map((psychologist) => (
                  <tr key={psychologist.id} className="border-t border-orange-100">
                    <td className="px-4 py-2 text-gray-900">
                      {psychologist.fullName || "Без имени"}
                    </td>
                    <td className="px-4 py-2 text-gray-600">{psychologist.email}</td>
                    <td className="px-4 py-2 text-gray-600">
                      {formatDate(psychologist.lastArticleDate)}
                    </td>
                    <td className="px-4 py-2">
                      <a
                        href={`/admin/psychologists/${psychologist.id}/edit`}
                        className="text-[#5858E2] hover:underline text-sm"
                      >
                        Профиль
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Мало времени на сдачу */}
      {hasAtRisk && (
        <div>
          <h3 className="text-sm font-medium text-orange-800 mb-2">
            Мало времени на сдачу ({data.atRisk.length})
          </h3>
          <div className="bg-white border border-orange-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-orange-100">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-orange-900">ФИО</th>
                  <th className="px-4 py-2 text-left font-medium text-orange-900">Email</th>
                  <th className="px-4 py-2 text-left font-medium text-orange-900">Последняя статья</th>
                  <th className="px-4 py-2 text-left font-medium text-orange-900">Действие</th>
                </tr>
              </thead>
              <tbody>
                {data.atRisk.map((psychologist) => (
                  <tr key={psychologist.id} className="border-t border-orange-100">
                    <td className="px-4 py-2 text-gray-900">
                      {psychologist.fullName || "Без имени"}
                    </td>
                    <td className="px-4 py-2 text-gray-600">{psychologist.email}</td>
                    <td className="px-4 py-2 text-gray-600">
                      {formatDate(psychologist.lastArticleDate)}
                    </td>
                    <td className="px-4 py-2">
                      <a
                        href={`/admin/psychologists/${psychologist.id}/edit`}
                        className="text-[#5858E2] hover:underline text-sm"
                      >
                        Профиль
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}