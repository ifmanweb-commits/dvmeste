"use server";

import { prisma } from "@/lib/prisma";
import { LeadStatus } from "@prisma/client";

/**
 * Данные для дашборда психолога
 */
export interface DashboardData {
  newLeadsCount: number;
  totalLeadsCount: number;
  acceptedLeadsCount: number;
  totalAcceptedLeadsCount: number;
  oldAcceptedLeads: Array<{
    id: string;
    clientName: string | null;
    statusChangedAt: Date | null;
    daysSinceAccept: number;
  }>;
  articleBalance: {
    totalBonus: number;
    approvedArticlesCount: number;
  };
  unreadNotificationsCount: number;
  unreadMessagesCount: number;
  hasActiveDialog: boolean;
  // Новые поля для наград и статей
  awards: Array<{
    id: string;
    certificationId: string | null;
    certificationTitle: string;
    rewardType: string;
    badgeUrl: string | null;
    certificateImageUrl: string | null;
    awardedAt: Date;
    level: number | null;
  }>;
  submittedArticlesCount: number;
  publishedArticlesCount: number;
}

/**
 * Получить данные для дашборда психолога
 */
export async function getDashboardData(psychologistId: string): Promise<{ success: boolean; data?: DashboardData; error?: string }> {
  try {
    // 1. Количество новых заявок
    const newLeadsCount = await prisma.lead.count({
      where: {
        psychologistId,
        status: LeadStatus.NEW,
      },
    });

    // 2. Общее количество заявок и количество принятых
    const [totalLeadsCount, acceptedLeadsCount, totalAcceptedLeadsCount] = await Promise.all([
      prisma.lead.count({
        where: { psychologistId },
      }),
      prisma.lead.count({
        where: {
          psychologistId,
          status: LeadStatus.ACCEPTED,
        },
      }),
      prisma.lead.count({
        where: {
          psychologistId,
          status: {
            in: [LeadStatus.ACCEPTED, LeadStatus.COMPLETED],
          },
        },
      }),
    ]);

    // 3. Заявки, принятые больше 7 дней назад
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const oldAcceptedLeads = await prisma.lead.findMany({
      where: {
        psychologistId,
        status: LeadStatus.ACCEPTED,
        statusChangedAt: {
          lte: cutoffDate,
        },
      },
      include: {
        client: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        statusChangedAt: "asc",
      },
    });

    const formattedOldLeads = oldAcceptedLeads.map((lead) => {
      const daysSinceAccept = lead.statusChangedAt
        ? Math.floor((Date.now() - lead.statusChangedAt.getTime()) / (24 * 60 * 60 * 1000))
        : 0;
      return {
        id: lead.id,
        clientName: lead.client.name,
        statusChangedAt: lead.statusChangedAt,
        daysSinceAccept,
      };
    });

    // 3. Баланс статей - получаем все одобренные статьи и суммируем их баллы
    const approvedArticles = await prisma.article.findMany({
      where: {
        userId: psychologistId,
        moderationStatus: "APPROVED",
      },
      select: {
        bonusPoints: true,
      },
    });

    const totalBonus = approvedArticles.reduce((sum, article) => sum + (article.bonusPoints ?? 0), 0);
    const approvedArticlesCount = approvedArticles.length;

    // 4. Количество непрочитанных уведомлений
    const unreadNotificationsCount = await prisma.notification.count({
      where: {
        userId: psychologistId,
        isRead: false,
        isArchived: false,
      },
    });

    // 5. Количество непрочитанных сообщений и наличие активного диалога
    const dialog = await prisma.dialog.findUnique({
      where: {
        userId: psychologistId,
      },
      include: {
        messages: {
          where: {
            isRead: false,
            direction: "to_user",
          },
        },
      },
    });

    const unreadMessagesCount = dialog?.messages.length ?? 0;
    const hasActiveDialog = dialog?.status === "ACTIVE";

    // 6. Получаем награды пользователя (сертификаты и ачивки)
    const awardsData = await prisma.certificationAward.findMany({
      where: {
        userId: psychologistId,
      },
      include: {
        certification: {
          select: {
            id: true,
            title: true,
            rewardType: true,
            badgeUrl: true,
            level: true,
          },
        },
        certificate: {
          select: {
            imageUrl: true,
          },
        },
      },
      orderBy: {
        awardedAt: 'desc',
      },
    });

    // Форматируем награды: сначала сертификаты, потом ачивки
    const formattedAwards = awardsData
      .filter(award => award.certification)
      .map(award => ({
        id: award.id,
        certificationId: award.certificationId,
        certificationTitle: award.certification!.title,
        rewardType: award.certification!.rewardType,
        badgeUrl: award.certification!.badgeUrl,
        certificateImageUrl: award.certificate?.imageUrl ?? null,
        awardedAt: award.awardedAt,
        level: award.certification!.level,
      }))
      .sort((a, b) => {
        // Сначала сертификаты (rewardType = 'certificate'), потом ачивки
        if (a.rewardType === 'certificate' && b.rewardType !== 'certificate') return -1;
        if (a.rewardType !== 'certificate' && b.rewardType === 'certificate') return 1;
        // Внутри каждой группы сортируем по дате получения
        return new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime();
      });

    // 7. Получаем количество статей
    const [submittedArticlesCount, publishedArticlesCount] = await Promise.all([
      prisma.article.count({
        where: {
          userId: psychologistId,
        },
      }),
      prisma.article.count({
        where: {
          userId: psychologistId,
          isPublished: true,
        },
      }),
    ]);

    return {
      success: true,
      data: {
        newLeadsCount,
        totalLeadsCount,
        acceptedLeadsCount,
        totalAcceptedLeadsCount,
        oldAcceptedLeads: formattedOldLeads,
        articleBalance: {
          totalBonus,
          approvedArticlesCount,
        },
        unreadNotificationsCount,
        unreadMessagesCount,
        hasActiveDialog,
        awards: formattedAwards,
        submittedArticlesCount,
        publishedArticlesCount,
      },
    };
  } catch (error) {
    console.error("Error getting dashboard data:", error);
    return { success: false, error: "Ошибка при получении данных дашборда" };
  }
}

/**
 * Получить статус публикации психолога
 */
export async function getPsychologistPublishStatus(psychologistId: string): Promise<{ 
  success: boolean; 
  isPublished?: boolean;
  status?: string;
  error?: string 
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: psychologistId },
      select: {
        status: true,
        isPublished: true,
      },
    });

    if (!user) {
      return { success: false, error: "Пользователь не найден" };
    }

    return {
      success: true,
      isPublished: user.isPublished ?? false,
      status: user.status ?? 'PENDING',
    };
  } catch (error) {
    console.error("Error getting psychologist publish status:", error);
    return { success: false, error: "Ошибка при получении статуса" };
  }
}