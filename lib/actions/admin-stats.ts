"use server";

import { prisma } from "@/lib/db";
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
      // Общая статистика психологов
      prisma.psychologist.count(),
      prisma.psychologist.count({ where: { status: "ACTIVE" } }),
      prisma.psychologist.count({ where: { status: "CANDIDATE" } }),
      prisma.psychologist.count({ where: { status: "SUSPENDED" } }),
      prisma.psychologist.count({ where: { status: "REJECTED" } }),
      
      // По уровням сертификации
      prisma.psychologist.count({ where: { certificationLevel: 1 } }),
      prisma.psychologist.count({ where: { certificationLevel: 2 } }),
      prisma.psychologist.count({ where: { certificationLevel: 3 } }),
      prisma.psychologist.count({ where: { certificationLevel: null } }),
      
      // Статьи
      prisma.article.count(),
      prisma.article.count({ where: { publishedAt: { not: null } } }),
      prisma.article.count({ where: { publishedAt: null } }),
      
      // Активность за неделю
      prisma.psychologist.count({ where: { createdAt: { gte: weekAgo } } }),
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