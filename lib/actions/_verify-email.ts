"use server";

import { prisma } from "@/lib/prisma";
import { unisenderService } from "@/lib/unisender.service";
export async function verifyEmail(token: string) {
  try {
    if (!prisma) {
      return { success: false, error: "База данных недоступна" };
    }

    // Ищем психолога по токену
    const psychologist = await prisma.psychologist.findFirst({
      where: {
        emailVerifyToken: token,
        emailVerified: false,
      },
      include: {
        user: true, // Включаем связанного User
      },
    });

    if (!psychologist) {
      return { 
        success: false, 
        error: "Недействительный или устаревший токен" 
      };
    }

    // Обновляем в транзакции
    await prisma.$transaction(async (tx) => {
      // Обновляем психолога
      await tx.psychologist.update({
        where: { id: psychologist.id },
        data: {
          emailVerified: true,
          emailVerifyToken: null,
          emailVerifiedAt: new Date(),
          status: "CANDIDATE", // Меняем статус
        },
      });

      // Обновляем пользователя NextAuth
      if (psychologist.user) {
        await tx.user.update({
          where: { id: psychologist.user.id },
          data: {
            emailVerified: new Date(),
          },
        });
      }
    });

    // Подписка на Unisender
    try {
    await unisenderService.subscribe({
        email: psychologist.email,
        name: psychologist.fullName,
        tags: ['psychologist_candidate', 'new_registration']
    });
    } catch (subError) {
    // Логируем ошибку, но не прерываем процесс подтверждения
    console.error('Failed to subscribe to Unisender:', subError);
    }

    return { success: true };

  } catch (error) {
    console.error("Email verification error:", error);
    return { 
      success: false, 
      error: "Ошибка при подтверждении email" 
    };
  }
}