interface ArticlesStatsProps {
  data: {
    total: number;
    published: number;
    thisMonth: number;
  };
}

export function ArticlesStats({ data }: ArticlesStatsProps) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6">
      <h2 className="text-xl font-semibold mb-4">Статьи</h2>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600">Всего статей</span>
          <span className="text-lg font-semibold text-gray-900">{data.total}</span>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600">Опубликовано</span>
          <span className="text-lg font-semibold text-green-600">{data.published}</span>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600">Добавлено в этом месяце</span>
          <span className="text-lg font-semibold text-blue-600">{data.thisMonth}</span>
        </div>
      </div>
    </div>
  );
}