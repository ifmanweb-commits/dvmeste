"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function addCourseChallenge(
  courseId: string,
  challengeId: string,
  status: "enrolled" | "graduated"
) {
  try {
    const user = await getCurrentUser();
    if (!user || (!user.isAdmin && !user.isManager)) {
      return { success: false, error: "Доступ запрещён" };
    }

    // Проверяем существование курса и испытания
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return { success: false, error: "Курс не найден" };
    }

    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return { success: false, error: "Испытание не найдено" };
    }

    // Создаём связь
    await prisma.courseChallengeAccess.create({
      data: {
        courseId,
        challengeId,
        status,
      },
    });

    revalidatePath(`/admin/courses/${courseId}/edit`);

    return { success: true };
  } catch (error) {
    console.error("Ошибка при добавлении связи курса с испытанием:", error);
    return { success: false, error: "Ошибка сервера" };
  }
}

export async function removeCourseChallenge(
  courseId: string,
  challengeId: string,
  status: "enrolled" | "graduated"
) {
  try {
    const user = await getCurrentUser();
    if (!user || (!user.isAdmin && !user.isManager)) {
      return { success: false, error: "Доступ запрещён" };
    }

    // Удаляем связь
    await prisma.courseChallengeAccess.delete({
      where: {
        courseId_challengeId_status: {
          courseId,
          challengeId,
          status,
        },
      },
    });

    revalidatePath(`/admin/courses/${courseId}/edit`);

    return { success: true };
  } catch (error) {
    console.error("Ошибка при удалении связи курса с испытанием:", error);
    return { success: false, error: "Ошибка сервера" };
  }
}

export async function getCourseChallenges(courseId: string) {
  try {
    const accesses = await prisma.courseChallengeAccess.findMany({
      where: { courseId },
      include: {
        challenge: {
          include: {
            test: true,
          },
        },
      },
      orderBy: { order: "asc" },
    });

    return {
      enrolled: accesses.filter((a) => a.status === "enrolled"),
      graduated: accesses.filter((a) => a.status === "graduated"),
    };
  } catch (error) {
    console.error("Ошибка при получении связей курса:", error);
    return { enrolled: [], graduated: [] };
  }
}