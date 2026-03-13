"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { markdownToHtml } from "@/lib/markdownToHtml"; // ← импортируем

async function checkModerator() {
  const user = await getCurrentUser();
  if (!user?.isAdmin && !user?.isManager) {
    throw new Error("Доступ запрещён");
  }
  return user;
}

function calculateArticleCreditPeriod(userId: string) {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear()
  };
}

export async function getModerationArticle(id: string) {
  try {
    await checkModerator();

    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            slug: true
          }
        }
      }
    });

    if (!article) {
      throw new Error("Статья не найдена");
    }

    // Конвертируем Markdown в HTML для предпросмотра
    const htmlContent = markdownToHtml(article.content); // ← используем реальную функцию

    return {
      success: true,
      article: {
        ...article,
        htmlContent
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function approveArticle(articleId: string, htmlContent: string) {
  try {
    const moderator = await checkModerator();

    const article = await prisma.article.findUnique({
      where: { 
        id: articleId,
        moderationStatus: "PENDING"
      },
      include: {
        user: true
      }
    });

    if (!article) {
      throw new Error("Статья уже отмодерирована кем-то другим или удалена");
    }

    const { month, year } = calculateArticleCreditPeriod(article.userId!);
    const now = new Date();

    // Обновляем статью (credited поля больше не заполняем)
    await prisma.article.update({
      where: { id: articleId },
      data: {
        moderationStatus: "APPROVED",
        content: htmlContent,
        moderatedAt: now,
        moderatedBy: moderator.id
        // creditedMonth/year больше не трогаем
      }
    });

    // Создаём запись в новой таблице
    await prisma.articleCredit.create({
      data: {
        userId: article.userId!,
        articleId: article.id,
        articleTitle: article.title || 'Без названия',
        month,
        year,
        approvedAt: now,
        moderatedBy: moderator.id,
      }
    });

    revalidatePath("/admin/moderation/articles");
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function revisionArticle(articleId: string, comment: string) {
  try {
    const moderator = await checkModerator();

    if (!comment || comment.trim().length === 0) {
      throw new Error("Комментарий обязателен");
    }

    const article = await prisma.article.findUnique({
      where: { 
        id: articleId,
        moderationStatus: "PENDING"
      }
    });

    if (!article) {
      throw new Error("Статья уже отмодерирована кем-то другим или удалена");
    }

    await prisma.article.update({
      where: { id: articleId },
      data: {
        moderationStatus: "REVISION",
        moderatorComment: comment.trim(),
        moderatedAt: new Date(),
        moderatedBy: moderator.id
      }
    });

    revalidatePath("/admin/moderation/articles");
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}