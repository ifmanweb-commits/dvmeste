'use client';

import { useState } from 'react';
import { updateUserCourseStatus } from '@/lib/actions/courses';

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

interface CoursesBlockProps {
  psychologistId: string;
  courses: Course[];
  userCourses: UserCourse[];
}

export function CoursesBlock({ psychologistId, courses, userCourses }: CoursesBlockProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [localUserCourses, setLocalUserCourses] = useState<UserCourse[]>(userCourses);

  const getUserCourseStatus = (courseId: string): string | null => {
    const userCourse = localUserCourses.find(uc => uc.courseId === courseId);
    return userCourse?.status || null;
  };

  const handleStatusChange = async (courseId: string, status: 'enrolled' | 'graduated' | null) => {
    setIsSaving(true);
    try {
      await updateUserCourseStatus(psychologistId, courseId, status);
      
      // Обновляем локальное состояние
      if (status === null) {
        setLocalUserCourses(prev => prev.filter(uc => uc.courseId !== courseId));
      } else {
        const existing = localUserCourses.find(uc => uc.courseId === courseId);
        if (existing) {
          setLocalUserCourses(prev => prev.map(uc => 
            uc.courseId === courseId ? { ...uc, status } : uc
          ));
        } else {
          setLocalUserCourses(prev => [...prev, {
            id: Date.now().toString(),
            courseId,
            status,
            course: courses.find(c => c.id === courseId)!,
          }]);
        }
      }
    } catch (error) {
      console.error('Error updating course status:', error);
      alert('Ошибка при обновлении статуса курса');
    } finally {
      setIsSaving(false);
    }
  };

  if (courses.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 text-center text-gray-500 text-sm">
        Курсы ещё не созданы
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Курсы
        </h2>
        {isSaving && (
          <span className="text-xs text-[#5858E2] animate-pulse">Сохранение...</span>
        )}
      </div>
      <div className="p-6 space-y-4">
        {courses.map((course) => {
          const currentStatus = getUserCourseStatus(course.id);
          
          return (
            <div key={course.id} className="flex items-center justify-between py-2">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{course.title}</p>
                <p className="text-xs text-gray-500">{course.shortTitle}</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name={`course-${course.id}`}
                    checked={currentStatus === null}
                    onChange={() => handleStatusChange(course.id, null)}
                    disabled={isSaving}
                    className="h-4 w-4 text-[#5858E2] focus:ring-[#5858E2] border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-600">нет</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name={`course-${course.id}`}
                    checked={currentStatus === 'enrolled'}
                    onChange={() => handleStatusChange(course.id, 'enrolled')}
                    disabled={isSaving}
                    className="h-4 w-4 text-[#5858E2] focus:ring-[#5858E2] border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-600">ученик</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name={`course-${course.id}`}
                    checked={currentStatus === 'graduated'}
                    onChange={() => handleStatusChange(course.id, 'graduated')}
                    disabled={isSaving}
                    className="h-4 w-4 text-[#5858E2] focus:ring-[#5858E2] border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-600">выпускник</span>
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}