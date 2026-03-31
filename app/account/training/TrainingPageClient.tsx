'use client';

import { useState } from 'react';
import { activateCourseKey } from '@/lib/actions/courses';

interface Course {
  id: string;
  title: string;
  shortTitle: string;
}

interface UserCourse {
  id: string;
  courseId: string;
  status: string;
  assignedAt: Date | string;
  course: Course;
}

interface TrainingPageClientProps {
  userId: string;
  initialUserCourses: UserCourse[];
  allCourses: Course[];
}

export default function TrainingPageClient({
  userId,
  initialUserCourses,
  allCourses,
}: TrainingPageClientProps) {
  const [key, setKey] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [userCourses, setUserCourses] = useState<UserCourse[]>(initialUserCourses);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActivating(true);
    setMessage(null);

    try {
      const result = await activateCourseKey(key.trim(), userId);

      if (result.error) {
        setMessage({ type: 'error', text: result.error });
      } else if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `Доступ к курсу "${result.course.title}" активирован!` 
        });
        setKey('');
        
        // Обновляем список курсов
        const existingCourse = userCourses.find(uc => uc.courseId === result.course.id);
        if (!existingCourse) {
          setUserCourses(prev => [...prev, {
            id: Date.now().toString(),
            courseId: result.course.id,
            status: result.status,
            assignedAt: new Date().toISOString(),
            course: result.course,
          }]);
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Произошла ошибка при активации ключа' });
    } finally {
      setIsActivating(false);
    }
  };

  const getStatusText = (status: string) => {
    return status === 'enrolled' ? 'Ученик' : 'Выпускник';
  };

  const getStatusColor = (status: string) => {
    return status === 'enrolled' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-green-100 text-green-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-6">Обучение</h1>

        {/* Форма активации */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Активировать доступ</h2>
          <form onSubmit={handleActivate} className="flex gap-3">
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Введите промокод"
              disabled={isActivating}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-[#5858E2] focus:outline-none focus:ring-1 focus:ring-[#5858E2]"
            />
            <button
              type="submit"
              disabled={isActivating || !key.trim()}
              className="rounded-lg bg-[#5858E2] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4a4ac9] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isActivating ? 'Активация...' : 'Активировать'}
            </button>
          </form>

          {message && (
            <div className={`mt-4 rounded-lg p-4 text-sm ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
              {message.text}
            </div>
          )}
        </div>

        {/* Список курсов */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-800">Ваши курсы</h2>
          </div>

          {userCourses.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="mt-4 text-gray-500">У вас пока нет активных курсов</p>
              <p className="mt-2 text-sm text-gray-400">Активируйте промокод, чтобы получить доступ к обучению</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {userCourses.map((userCourse) => (
                <div
                  key={userCourse.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{userCourse.course.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{userCourse.course.shortTitle}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(userCourse.status)}`}>
                        {getStatusText(userCourse.status)}
                      </span>
                      <span className="text-sm text-gray-500">
                        с {new Date(userCourse.assignedAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}