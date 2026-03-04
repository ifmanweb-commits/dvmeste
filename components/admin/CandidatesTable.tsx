import Link from "next/link";

interface Candidate {
  id: string;
  fullName: string | null;
  email: string;
  city: string | null;
  price: number | null;
  certificationLevel: number;
  status: string;
  createdAt: string;
  workFormat: string | null;
  mainParadigm: string[];
  contactInfo: string | null;
}

interface CandidatesTableProps {
  candidates: Candidate[];
  currentPage: number;
  totalPages: number;
  search: string;
}
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export function CandidatesTable({ 
  candidates, 
  currentPage, 
  totalPages, 
  search 
}: CandidatesTableProps) {
  
  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'PENDING':
        return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Ожидает подтверждения</span>;
      case 'CANDIDATE':
        return <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">Кандидат</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getDisplayName = (candidate: Candidate) => {
    if (candidate.fullName) return candidate.fullName;
    return <span className="text-gray-400 italic">Без имени</span>;
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Имя
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Статус
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Город
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Цена
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Контакты
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Регистрация
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Действия
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {candidates.map((candidate) => (
            <tr key={candidate.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {getDisplayName(candidate)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {candidate.email}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {getStatusDisplay(candidate.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {candidate.city || '—'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {candidate.price ? `${candidate.price} ₽` : '—'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate" title={candidate.contactInfo || ''}>
                {candidate.contactInfo || '—'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(candidate.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Link
                  href={`/admin/psychologists/${candidate.id}/edit`}
                  className="text-[#5858E2] hover:text-[#4848d0] mr-4"
                >
                  Редактировать
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Страница {currentPage} из {totalPages}
          </div>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link
                href={`/admin/candidates?page=${currentPage - 1}${search ? `&search=${search}` : ''}`}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                Назад
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={`/admin/candidates?page=${currentPage + 1}${search ? `&search=${search}` : ''}`}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                Вперед
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}