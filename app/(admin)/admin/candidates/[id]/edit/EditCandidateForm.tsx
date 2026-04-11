'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateCandidate, verifyPsychologist } from '@/lib/actions/admin-candidates';
import { CoursesBlock } from '@/components/admin/CoursesBlock';

interface Course {
  id: string;
  title: string;
  shortTitle: string;
}

interface UserCourse {
  id: string;
  courseId: string;
  status: string;
  course: Course;
}

interface Candidate {
  id: string;
  fullName: string | null;
  email: string;
  city: string | null;
  gender: string | null;
  birthDate: Date | null;
  price: number | null;
  freeSession: number;
  certificationLevel: number;
  status: string;
  workFormat: string | null;
  contactInfo: string | null;
  courses: UserCourse[];
}

interface EditCandidateFormProps {
  candidate: Candidate;
  courses: Course[];
}

export function EditCandidateForm({ candidate, courses }: EditCandidateFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Состояние формы
  const [formData, setFormData] = useState({
    fullName: candidate.fullName || '',
    email: candidate.email,
    city: candidate.city || '',
    gender: candidate.gender || '',
    birthDate: candidate.birthDate ? new Date(candidate.birthDate).toISOString().split('T')[0] : '',
    price: candidate.price?.toString() || '',
    freeSession: candidate.freeSession?.toString() || '0',
    workFormat: candidate.workFormat || '',
    contactInfo: candidate.contactInfo || '',
  });

  // Состояние для блока проверки
  const [certificationLevel, setCertificationLevel] = useState('');
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const result = await updateCandidate(candidate.id, {
        fullName: formData.fullName,
        city: formData.city,
        gender: formData.gender,
        birthDate: formData.birthDate ? new Date(formData.birthDate) : null,
        price: formData.price ? parseInt(formData.price) : undefined,
        workFormat: formData.workFormat,
        contactInfo: formData.contactInfo,
      });

      if (result.error) {
        setMessage({ type: 'error', text: result.error });
      } else {
        setMessage({ type: 'success', text: 'Данные кандидата обновлены' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка при сохранении' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const level = parseInt(certificationLevel) || 0;
      const result = await verifyPsychologist(candidate.id, level);
      
      if (result.error) {
        setMessage({ type: 'error', text: result.error });
      } else {
        // Редирект на страницу редактирования психолога
        router.push(`/admin/psychologists/${candidate.id}/edit`);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка при проверке психолога' });
    } finally {
      setIsVerifying(false);
    }
  };

  const getCertificationLevelText = (level: string) => {
    switch (level) {
      case '1': return '1 уровень';
      case '2': return '2 уровень';
      case '3': return '3 уровень';
      default: return 'без уровня';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Редактирование психолога</h1>
        <a
          href="/admin/candidates"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Назад к списку
        </a>
      </div>

      {message && (
        <div className={`rounded-lg p-4 text-sm ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
          {message.text}
        </div>
      )}

      {/* Основная форма */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-semibold text-gray-800">Базовые данные</h2>
        </div>
        <div className="p-6 space-y-4">
          {/* Ряд 1: Имя, Пол */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ФИО
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Пол
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
              >
                <option value="">Не указано</option>
                <option value="MALE">Мужской</option>
                <option value="FEMALE">Женский</option>
              </select>
            </div>
          </div>

          {/* Ряд 2: Город, Дата рождения */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Город
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Дата рождения
              </label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
              />
            </div>
          </div>

          {/* Ряд 3: Цена приёма, Бесплатных сессий */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Стоимость сессии (₽)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Бесплатных сессий
              </label>
              <input
                type="number"
                name="freeSession"
                value={formData.freeSession}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
              />
            </div>
          </div>

          {/* Ряд 4: Формат работы (один в ряду) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Формат работы
            </label>
            <select
              name="workFormat"
              value={formData.workFormat}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
            >
              <option value="">Не указано</option>
              <option value="Онлайн">Онлайн</option>
              <option value="Очно">Очно</option>
              <option value="Онлайн и Очно">Онлайн и Очно</option>
            </select>
          </div>

          {/* Ряд 5: Контакты (один в ряду) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Контакты
            </label>
            <input
              type="text"
              name="contactInfo"
              value={formData.contactInfo}
              onChange={handleChange}
              placeholder="Telegram, WhatsApp, телефон"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
            />
          </div>

          {/* Email только для чтения */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              readOnly
              disabled
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-500 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">Email нельзя изменить</p>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-[#5858E2] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </div>
      </form>

      {/* Блок Курсы */}
      <CoursesBlock 
        psychologistId={candidate.id}
        courses={courses}
        userCourses={candidate.courses || []}
      />

      {/* Блок Проверка психолога */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-semibold text-gray-800">Проверка психолога</h2>
        </div>
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Подтвердив проверку психолога, вы переводите его в новый статус участника. Ему становится доступна расширенная анкета и другие преимущества.
          </p>
          <p>Проверенных психологов без уровня квалификации не бывает. Нужно будет выбрать уровень квалификации этого психолога. Убедитесь, что он прошел все испытания для этого.</p>
          <button
            type="button"
            onClick={() => setIsVerifyModalOpen(true)}
            className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            Психолог проверен
          </button>
          
        </div>
      </div>

      {/* Модалка подтверждения */}
      {isVerifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Проверка психолога
              </h3>
              <p className="text-gray-600">
                Чтобы сделать психолога проверенным, нужно подтвердить его уровень квалификации. Какой уровень назначить?
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Уровень квалификации
              </label>
              <select
                value={certificationLevel}
                onChange={(e) => setCertificationLevel(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
              >
                <option value="">Выберите уровень</option>
                <option value="1">Уровень 1</option>
                <option value="2">Уровень 2</option>
                <option value="3">Уровень 3</option>
              </select>
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsVerifyModalOpen(false);
                  setCertificationLevel('');
                }}
                disabled={isVerifying}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Отменить
              </button>
              <button
                type="button"
                onClick={handleVerify}
                disabled={isVerifying || !certificationLevel}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? 'Проверка...' : 'Подтвердить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}