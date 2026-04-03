"use server";

import { prisma } from "@/lib/prisma";
import { isDbSyncError } from "@/lib/db-error";

export async function getAdminStats() {
  if (!prisma) return null;

  try {
    // Получаем текущую дату минус 7 дней
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Параллельно выполняем все запросы
    const [
      totalPsychologists,
      activePsychologists,
      candidatePsychologists,
      suspendedPsychologists,
      rejectedPsychologists,
      level1,
      level2,
      level3,
      noLevel,
      totalArticles,
      publishedArticles,
      draftArticles,
      newPsychologistsWeek,
      newArticlesWeek,
    ] = await Promise.all([
      // Общая статистика психологов (пользователи с isPublished: true)
      prisma.user.count({ where: { isPublished: true } }),
      prisma.user.count({ where: { isPublished: true, status: "ACTIVE" } }),
      prisma.user.count({ where: { isPublished: true, status: "CANDIDATE" } }),
      prisma.user.count({ where: { isPublished: true, status: "PENDING" } }),
      prisma.user.count({ where: { isPublished: true, status: "REJECTED" } }),
      
      // По уровням сертификации
      prisma.user.count({ where: { isPublished: true, certificationLevel: 1 } }),
      prisma.user.count({ where: { isPublished: true, certificationLevel: 2 } }),
      prisma.user.count({ where: { isPublished: true, certificationLevel: 3 } }),
      prisma.user.count({ where: { isPublished: true, certificationLevel: 0 } }),
      
      // Статьи
      prisma.article.count(),
      prisma.article.count({ where: { publishedAt: { not: null } } }),
      prisma.article.count({ where: { publishedAt: null } }),
      
      // Активность за неделю
      prisma.user.count({ where: { isPublished: true, createdAt: { gte: weekAgo } } }),
      prisma.article.count({ where: { createdAt: { gte: weekAgo } } }),
    ]);

    return {
      psychologists: {
        total: totalPsychologists,
        active: activePsychologists,
        candidate: candidatePsychologists,
        suspended: suspendedPsychologists,
        rejected: rejectedPsychologists,
        levels: {
          level1,
          level2,
          level3,
          noLevel,
        },
      },
      articles: {
        total: totalArticles,
        published: publishedArticles,
        draft: draftArticles,
      },
      activity: {
        newPsychologists: newPsychologistsWeek,
        newArticles: newArticlesWeek,
      },
    };
  } catch (err) {
    if (isDbSyncError(err)) return null;
    console.error("Error fetching admin stats:", err);
    return null;
  }
}