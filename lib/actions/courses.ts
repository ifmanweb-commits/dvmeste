'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/require';

// ==================== ТИПЫ ====================

export interface CreateCourseInput {
  title: string;
  shortTitle: string;
  slug: string;
  description?: string;
}

export interface UpdateCourseInput {
  title?: string;
  shortTitle?: string;
  slug?: string;
  description?: string;
}

// ==================== ДЛЯ ПОЛЬЗОВАТЕЛЯ ====================

/**
 * Получить все курсы пользователя
 */
export async function getUserCourses(userId: string) {
  const userCourses = await prisma.userCourse.findMany({
    where: { userId },
    include: {
      course: true,
    },
    orderBy: { assignedAt: 'desc' },
  });

  return userCourses;
}

// ==================== АДМИНСКИЕ ====================

/**
 * Получить все курсы
 */
export async function getAllCourses() {
  const courses = await prisma.course.findMany({
    include: {
      _count: {
        select: {
          enrollments: true,
        },
      },
      enrollments: {
        select: {
          status: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return courses.map((course) => ({
    ...course,
    enrolledCount: course.enrollments.filter((e) => e.status === 'enrolled').length,
    graduatedCount: course.enrollments.filter((e) => e.status === 'graduated').length,
  }));
}

/**
 * Получить курс по ID
 */
export async function getCourseById(id: string) {
  return prisma.course.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
  });
}

/**
 * Создать курс
 */
export async function createCourse(data: CreateCourseInput) {
  await requireAdmin();

  try {
    const course = await prisma.course.create({
      data,
    });

    revalidatePath('/admin/courses');

    return { success: true, course };
  } catch (error) {
    return { error: 'Ошибка при создании курса' };
  }
}

/**
 * Обновить курс
 */
export async function updateCourse(id: string, data: UpdateCourseInput) {
  await requireAdmin();

  try {
    const course = await prisma.course.update({
      where: { id },
      data,
    });

    revalidatePath('/admin/courses');

    return { success: true, course };
  } catch (error) {
    return { error: 'Ошибка при обновлении курса' };
  }
}

/**
 * Удалить курс
 */
export async function deleteCourse(id: string) {
  await requireAdmin();

  try {
    await prisma.course.delete({
      where: { id },
    });

    revalidatePath('/admin/courses');

    return { success: true };
  } catch (error) {
    return { error: 'Ошибка при удалении курса' };
  }
}

/**
 * Изменить статус пользователя на курсе
 */
export async function updateUserCourseStatus(
  userId: string,
  courseId: string,
  status: 'enrolled' | 'graduated' | null
) {
  try {
    if (status === null) {
      // Удалить запись
      await prisma.userCourse.deleteMany({
        where: { userId, courseId },
      });
    } else {
      // Обновить или создать
      await prisma.userCourse.upsert({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
        update: { status },
        create: {
          userId,
          courseId,
          status,
        },
      });
    }

    revalidatePath(`/admin/psychologists/${userId}/edit`);
    revalidatePath('/admin/courses');

    return { success: true };
  } catch (error) {
    return { error: 'Ошибка при обновлении статуса' };
  }
}

/**
 * Получить студентов курса
 */
export async function getCourseStudents(courseId: string, status?: string) {
  const where: { courseId: string; status?: string } = { courseId };
  if (status) {
    where.status = status;
  }

  const enrollments = await prisma.userCourse.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          slug: true,
          isPublished: true,
        },
      },
      course: true,
    },
    orderBy: { assignedAt: 'desc' },
  });

  return enrollments;
}

/**
 * Получить все курсы (для админки)
 */
export async function getAllCoursesForSelect() {
  return prisma.course.findMany({
    select: {
      id: true,
      title: true,
      shortTitle: true,
    },
    orderBy: { title: 'asc' },
  });
}

/**
 * Получить всех психологов для админки
 */
export async function getAllPsychologists() {
  return prisma.user.findMany({
    where: {
      status: 'ACTIVE',
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      slug: true,
      isPublished: true,
      courses: {
        select: {
          courseId: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

