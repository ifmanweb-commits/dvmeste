'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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

export interface CreateCourseKeyInput {
  courseId: string;
  key?: string;
  status: 'enrolled' | 'graduated';
  maxUses: number;
  expiresAt?: Date | null;
}

export interface UpdateCourseKeyInput {
  key?: string;
  status?: 'enrolled' | 'graduated';
  maxUses?: number;
  expiresAt?: Date | null;
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

/**
 * Активировать промокод
 */
export async function activateCourseKey(key: string, userId: string) {
  // Проверка авторизации
  if (!userId) {
    return { error: 'Необходимо войти в систему' };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Найти ключ
      const courseKey = await tx.courseKey.findUnique({
        where: { key },
        include: { course: true },
      });

      if (!courseKey) {
        throw new Error('Ключ не найден');
      }

      // Проверка срока действия
      if (courseKey.expiresAt && courseKey.expiresAt < new Date()) {
        throw new Error('Срок действия ключа истёк');
      }

      // Проверка лимита (если maxUses > 0)
      if (courseKey.maxUses > 0 && courseKey.usedCount >= courseKey.maxUses) {
        throw new Error('Ключ больше не действителен');
      }

      // Проверка: не активирован ли уже этот ключ пользователем
      const existingUse = await tx.courseKeyUse.findFirst({
        where: {
          keyId: courseKey.id,
          userId,
        },
      });

      if (existingUse) {
        throw new Error('Вы уже активировали этот ключ');
      }

      // Проверка: есть ли уже запись в UserCourse для этого курса
      const existingEnrollment = await tx.userCourse.findFirst({
        where: {
          userId,
          courseId: courseKey.courseId,
        },
      });

      if (!existingEnrollment) {
        // Создаём запись в UserCourse
        await tx.userCourse.create({
          data: {
            userId,
            courseId: courseKey.courseId,
            status: courseKey.status,
          },
        });
      } else {
        // Обновляем статус, если отличается
        if (existingEnrollment.status !== courseKey.status) {
          await tx.userCourse.update({
            where: { id: existingEnrollment.id },
            data: { status: courseKey.status },
          });
        }
      }

      // Увеличиваем usedCount
      await tx.courseKey.update({
        where: { id: courseKey.id },
        data: { usedCount: { increment: 1 } },
      });

      // Создаём запись в CourseKeyUse
      await tx.courseKeyUse.create({
        data: {
          keyId: courseKey.id,
          userId,
        },
      });

      return {
        course: courseKey.course,
        status: courseKey.status,
      };
    });

    revalidatePath('/account/training');

    return {
      success: true,
      course: result.course,
      status: result.status,
    };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Произошла ошибка при активации ключа' };
  }
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
          keys: true,
        },
      },
    },
  });
}

/**
 * Создать курс
 */
export async function createCourse(data: CreateCourseInput) {
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
 * Получить все промокоды курса
 */
export async function getCourseKeys(courseId: string) {
  return prisma.courseKey.findMany({
    where: { courseId },
    include: {
      _count: {
        select: {
          uses: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Получить промокод по ID
 */
export async function getCourseKeyById(id: string) {
  return prisma.courseKey.findUnique({
    where: { id },
  });
}

/**
 * Создать промокод
 */
export async function createCourseKey(data: CreateCourseKeyInput) {
  try {
    // Генерация ключа, если не указан
    const key = data.key || generateRandomKey();

    const courseKey = await prisma.courseKey.create({
      data: {
        ...data,
        key,
      },
    });

    revalidatePath(`/admin/courses/${data.courseId}/keys`);

    return { success: true, courseKey };
  } catch (error) {
    return { error: 'Ошибка при создании промокода' };
  }
}

/**
 * Обновить промокод
 */
export async function updateCourseKey(id: string, data: UpdateCourseKeyInput) {
  try {
    const courseKey = await prisma.courseKey.update({
      where: { id },
      data,
    });

    revalidatePath(`/admin/courses/${courseKey.courseId}/keys`);

    return { success: true, courseKey };
  } catch (error) {
    return { error: 'Ошибка при обновлении промокода' };
  }
}

/**
 * Удалить промокод
 */
export async function deleteCourseKey(id: string) {
  try {
    const courseKey = await prisma.courseKey.findUnique({
      where: { id },
    });

    if (!courseKey) {
      return { error: 'Промокод не найден' };
    }

    await prisma.courseKey.delete({
      where: { id },
    });

    revalidatePath(`/admin/courses/${courseKey.courseId}/keys`);

    return { success: true };
  } catch (error) {
    return { error: 'Ошибка при удалении промокода' };
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

// ==================== ВСПОМОГАТЕЛЬНЫЕ ====================

/**
 * Генерация случайного ключа
 */
function generateRandomKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) {
      result += '-';
    }
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}