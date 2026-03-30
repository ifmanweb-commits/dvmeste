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
  oldAcceptedLeads: Array<{
    id: string;
    clientName: string | null;
    statusChangedAt: Date | null;
    daysSinceAccept: number;
  }>;
  articleBalance: {
    lastCreditedMonth: number | null;
    lastCreditedYear: number | null;
    isCurrentMonth: boolean;
    unpaidArticlesCount?: number;
  };
  unreadNotificationsCount: number;
  unreadMessagesCount: number;
  hasActiveDialog: boolean;
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
    const [totalLeadsCount, acceptedLeadsCount] = await Promise.all([
      prisma.lead.count({
        where: { psychologistId },
      }),
      prisma.lead.count({
        where: {
          psychologistId,
          status: LeadStatus.ACCEPTED,
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

    // 3. Баланс статей
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // getMonth() возвращает 0-11
    const currentYear = now.getFullYear();

    const lastCredit = await prisma.articleCredit.findFirst({
      where: {
        userId: psychologistId,
      },
      orderBy: {
        creditedAt: "desc",
      },
    });

    const lastCreditedMonth = lastCredit?.month ?? null;
    const lastCreditedYear = lastCredit?.year ?? null;

    // Проверяем, оплачен ли текущий месяц
    const isCurrentMonthPaid = lastCredit !== null &&
      lastCredit.month === currentMonth && 
      lastCredit.year === currentYear;

    // Если не оплачен - считаем количество неоплаченных статей
    let unpaidArticlesCount: number | undefined;
    if (!isCurrentMonthPaid) {
      unpaidArticlesCount = await prisma.article.count({
        where: {
          userId: psychologistId,
          moderationStatus: "APPROVED",
          isPublished: true,
        },
      });
    }

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

    return {
      success: true,
      data: {
        newLeadsCount,
        totalLeadsCount,
        acceptedLeadsCount,
        oldAcceptedLeads: formattedOldLeads,
        articleBalance: {
          lastCreditedMonth,
          lastCreditedYear,
          isCurrentMonth: isCurrentMonthPaid,
          unpaidArticlesCount,
        },
        unreadNotificationsCount,
        unreadMessagesCount,
        hasActiveDialog,
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