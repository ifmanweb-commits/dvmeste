"use client"
import { useState } from "react";
import { activateCandidate } from "@/lib/actions/admin-candidates";
import { CheckCircle, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { PsychologistStatus } from "@prisma/client";

interface Candidate {
  id: string;
  fullName: string | null;
  email: string;
  city: string | null;
  price: number | null;
  gender: string | null;
  certificationLevel: number;
  status: PsychologistStatus; // Изменено со string на Enum
  createdAt: Date;            // Изменено со string на Date
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
const formatDate = (dateString: Date) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export function CandidatesTable({ candidates, currentPage, totalPages, search }: CandidatesTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<{id: string, name: string} | null>(null);
  const [loading, setLoading] = useState(false);

  const openConfirm = (id: string, name: string | null) => {
    setSelectedCandidate({ id, name: name || 'Без имени' });
    setIsModalOpen(true);
  };
  
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


  const handleActivate = async () => {
    if (!selectedCandidate) return;
    setLoading(true);
    const res = await activateCandidate(selectedCandidate.id);
    setLoading(false);
    
    if (res.success) {
      setIsModalOpen(false);
      setSelectedCandidate(null);
    } else {
      alert(res.error);
    }
  };
return (
    <div className="relative">
      <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg overflow-hidden border shadow">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Кандидат</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Город</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Пол</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Цена</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Контакты</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Действия</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {candidates.map((candidate) => (
            <tr key={candidate.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="text-m font-medium text-gray-900">{candidate.fullName || 'Имя не указано'}</div>
                <div className="text-sm text-gray-500">{candidate.email}</div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">{candidate.city || '—'}</td>
              <td className="px-6 py-4">{getStatusDisplay(candidate.status)}</td>
              <td className="px-6 py-4">{candidate.gender || '—'}</td>
              <td className="px-6 py-4">{candidate.price || '—'}</td>
              <td className="px-6 py-4">{candidate.contactInfo  || '—'}</td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => openConfirm(candidate.id, candidate.fullName)}
                  className="inline-flex items-center text-[#5858E2] hover:text-[#4747b5] font-medium text-sm transition-colors"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Сделать участником
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Модальное окно подтверждения */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-50 rounded-full text-[#5858E2]">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">
              Подтверждение активации
            </h3>
            <p className="text-sm text-center text-gray-500 mb-6">
              Вы уверены, что хотите сделать <b>{selectedCandidate?.name}</b> участником каталога? Ему будет открыт полный доступ к профилю.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleActivate}
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#5858E2] rounded-xl hover:bg-[#4747b5] transition-colors disabled:opacity-50"
              >
                {loading ? "Минутку..." : "Да, принять"}
              </button>
            </div>
          </div>
        </div>
      )}

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