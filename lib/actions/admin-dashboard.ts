"use server";

import { prisma } from "@/lib/prisma";
import { ModerationStatus, DocumentType, LeadStatus, PsychologistStatus, Prisma, DialogStatus } from "@prisma/client";

export interface DashboardStats {
  moderation: {
    profiles: number;
    documents: number;
    photos: number;
    articles: number;
    unreadMessages: number;
  };
  problematicLeads: {
    noResponseOver2Days: number;
    noProgressOver10Days: number;
  };
  articleDebts: {
    overdue: Array<{ id: string; fullName: string | null; email: string; lastArticleDate: Date | null }>;
    atRisk: Array<{ id: string; fullName: string | null; email: string; lastArticleDate: Date | null }>;
  };
}

/**
 * Получение статистики для дашборда админки
 */
export async function getDashboardStats(): Promise<{ success: boolean; stats?: DashboardStats; error?: string }> {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    // ==================== МОДЕРАЦИЯ ====================

    // Профили на модерации: получаем все профили с draftData и фильтруем по status = 'PENDING'
    const allUsersWithDraft = await prisma.user.findMany({
      where: {
        draftData: {
          not: Prisma.JsonNull,
        },
      },
      select: {
        draftData: true,
      },
    });

    // Фильтруем только те, у которых status = 'PENDING'
    const profilesCount = allUsersWithDraft.filter(user => {
      const draft = user.draftData as any;
      return draft?.status === 'PENDING';
    }).length;

    // Документы на модерации: verifiedAt = null и тип не PHOTO
    const documentsCount = await prisma.document.count({
      where: {
        verifiedAt: null,
        type: {
          not: DocumentType.PHOTO,
        },
      },
    });

    // Фото профилей на модерации: verifiedAt = null и тип PHOTO
    const photosCount = await prisma.document.count({
      where: {
        verifiedAt: null,
        type: DocumentType.PHOTO,
      },
    });

    // Статьи на модерации: moderationStatus = PENDING
    const articlesCount = await prisma.article.count({
      where: {
        moderationStatus: ModerationStatus.PENDING,
      },
    });

    // Диалоги, требующие ответа модератора: статус ACTIVE и есть непрочитанные сообщения от психолога
    // Получаем все диалоги с последним сообщением
    const allDialogs = await prisma.dialog.findMany({
      include: {
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    // Фильтруем: ACTIVE статус + есть сообщения + последнее сообщение от психолога (to_moder)
    const dialogsRequiringAnswer = allDialogs.filter(d => 
      d.status === DialogStatus.ACTIVE && 
      d.messages.length > 0 && 
      d.messages[0]?.direction === "to_moder"
    ).length;

    // ==================== ПРОБЛЕМНЫЕ ЗАЯВКИ ====================

    // Нет ответа > 2 дней: статус NEW и createdAt старше 2 дней
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const noResponseOver2Days = await prisma.lead.count({
      where: {
        status: LeadStatus.NEW,
        createdAt: {
          lt: twoDaysAgo,
        },
      },
    });

    // Нет прогресса > 10 дней: статус ACCEPTED и statusChangedAt старше 10 дней (или null)
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const noProgressOver10Days = await prisma.lead.count({
      where: {
        status: LeadStatus.ACCEPTED,
        OR: [
          { statusChangedAt: null },
          { statusChangedAt: { lt: tenDaysAgo } },
        ],
      },
    });

    // ==================== ДОЛГИ ПО СТАТЬЯМ ====================

    // Получаем всех активных психологов (не CANDIDATE)
    const psychologists = await prisma.user.findMany({
      where: {
        status: {
          not: PsychologistStatus.CANDIDATE,
        },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        articleCredits: {
          where: {
            approvedAt: {
              lte: now,
            },
          },
          orderBy: {
            approvedAt: "desc",
          },
          take: 1,
        },
      },
    });

    const overdue: Array<{ id: string; fullName: string | null; email: string; lastArticleDate: Date | null }> = [];
    const atRisk: Array<{ id: string; fullName: string | null; email: string; lastArticleDate: Date | null }> = [];

    // Определяем границы текущего месяца
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0); // последний день месяца
    const today = new Date();

    // Считаем дней до конца месяца
    const daysUntilEndOfMonth = Math.ceil(
      (lastDayOfMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    for (const psychologist of psychologists) {
      const lastCredit = psychologist.articleCredits[0];
      const lastArticleDate = lastCredit?.approvedAt || null;

      if (!lastArticleDate || lastArticleDate < firstDayOfMonth) {
        // Нет статьи за текущий месяц — просроченные
        overdue.push({
          id: psychologist.id,
          fullName: psychologist.fullName,
          email: psychologist.email,
          lastArticleDate,
        });
      } else if (lastArticleDate >= firstDayOfMonth) {
        // Есть статья за текущий месяц — проверяем, мало ли времени осталось
        // Показываем только если до конца месяца <= 5 дней
        if (daysUntilEndOfMonth <= 5) {
          atRisk.push({
            id: psychologist.id,
            fullName: psychologist.fullName,
            email: psychologist.email,
            lastArticleDate,
          });
        }
      }
    }

    return {
      success: true,
      stats: {
        moderation: {
          profiles: profilesCount,
          documents: documentsCount,
          photos: photosCount,
          articles: articlesCount,
          unreadMessages: dialogsRequiringAnswer, // Теперь это количество диалогов, требующих ответа
        },
        problematicLeads: {
          noResponseOver2Days,
          noProgressOver10Days,
        },
        articleDebts: {
          overdue,
          atRisk,
        },
      },
    };
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    return { success: false, error: "Ошибка при получении статистики дашборда" };
  }
}