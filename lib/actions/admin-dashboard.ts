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
    psychologistComplaints: number;
  };
  problematicLeads: {
    noResponseOver2Days: number;
    noProgressOver10Days: number;
  };
  psychologists: {
    total: number;
    notVerified: number;
    verified: number;
    inCatalog: number;
    level1: number;
    level2: number;
    level3: number;
  };
  students: {
    enrolled: number;
    graduated: number;
  };
  statistics: {
    newPsychologists: {
      thisMonth: number;
      thisWeek: number;
      today: number;
    };
    clients: {
      total: number;
      thisMonth: number;
      thisWeek: number;
      today: number;
    };
  };
}

/**
 * Получение статистики для дашборда админки
 */
export async function getDashboardStats(): Promise<{ success: boolean; stats?: DashboardStats; error?: string }> {
  try {
    const now = new Date();

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

    // Жалобы на психологов, которые ещё не приняты (статус CANDIDATE)
    // Получаем все жалобы на психологов
    const allComplaints = await prisma.complaint.findMany({
      where: {
        toPsychologistId: {
          not: null,
        },
      },
      include: {
        toPsychologist: {
          select: {
            status: true,
          },
        },
      },
    });

    // Считаем только жалобы на психологов со статусом CANDIDATE (не приняты)
    const psychologistComplaints = allComplaints.filter(
      c => c.toPsychologist?.status === PsychologistStatus.CANDIDATE
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

    // ==================== ПСИХОЛОГИ ====================

    // Общее количество: статус CANDIDATE или ACTIVE
    const totalPsychologists = await prisma.user.count({
      where: {
        status: {
          in: [PsychologistStatus.CANDIDATE, PsychologistStatus.ACTIVE],
        },
      },
    });

    // Не проверено: статус CANDIDATE
    const notVerified = await prisma.user.count({
      where: {
        status: PsychologistStatus.CANDIDATE,
      },
    });

    // Проверено: статус ACTIVE
    const verified = await prisma.user.count({
      where: {
        status: PsychologistStatus.ACTIVE,
      },
    });

    // В каталоге: isPublished = true и статус CANDIDATE или ACTIVE
    const inCatalog = await prisma.user.count({
      where: {
        isPublished: true,
        status: {
          in: [PsychologistStatus.CANDIDATE, PsychologistStatus.ACTIVE],
        },
      },
    });

    // По уровням сертификации (только для CANDIDATE и ACTIVE)
    const level1 = await prisma.user.count({
      where: {
        certificationLevel: 1,
        status: {
          in: [PsychologistStatus.CANDIDATE, PsychologistStatus.ACTIVE],
        },
      },
    });

    const level2 = await prisma.user.count({
      where: {
        certificationLevel: 2,
        status: {
          in: [PsychologistStatus.CANDIDATE, PsychologistStatus.ACTIVE],
        },
      },
    });

    const level3 = await prisma.user.count({
      where: {
        certificationLevel: 3,
        status: {
          in: [PsychologistStatus.CANDIDATE, PsychologistStatus.ACTIVE],
        },
      },
    });

    // ==================== УЧЕНИКИ ====================

    // Ученики: status = "enrolled" в UserCourse
    const enrolled = await prisma.userCourse.count({
      where: {
        status: "enrolled",
      },
    });

    // Выпускники: status = "graduated" в UserCourse
    const graduated = await prisma.userCourse.count({
      where: {
        status: "graduated",
      },
    });

    // ==================== СТАТИСТИКА ====================

    // Определяем границы периодов
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Начало недели (понедельник)
    const dayOfWeek = now.getDay(); // 0 = воскресенье, 1 = понедельник, ...
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - mondayOffset);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Начало сегодня
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    // Новых регистраций психологов (статус CANDIDATE или ACTIVE)
    const newPsychologistsThisMonth = await prisma.user.count({
      where: {
        status: { in: [PsychologistStatus.CANDIDATE, PsychologistStatus.ACTIVE] },
        createdAt: { gte: startOfMonth },
      },
    });

    const newPsychologistsThisWeek = await prisma.user.count({
      where: {
        status: { in: [PsychologistStatus.CANDIDATE, PsychologistStatus.ACTIVE] },
        createdAt: { gte: startOfWeek },
      },
    });

    const newPsychologistsToday = await prisma.user.count({
      where: {
        status: { in: [PsychologistStatus.CANDIDATE, PsychologistStatus.ACTIVE] },
        createdAt: { gte: startOfDay },
      },
    });

    // Заявки клиентов (Lead)
    const totalLeads = await prisma.lead.count();

    const leadsThisMonth = await prisma.lead.count({
      where: {
        createdAt: { gte: startOfMonth },
      },
    });

    const leadsThisWeek = await prisma.lead.count({
      where: {
        createdAt: { gte: startOfWeek },
      },
    });

    const leadsToday = await prisma.lead.count({
      where: {
        createdAt: { gte: startOfDay },
      },
    });

    // ==================== ПРОБЛЕМНЫЕ ЗАЯВКИ (старый код удалён, перенесён выше) ====================
    return {
      success: true,
      stats: {
        moderation: {
          profiles: profilesCount,
          documents: documentsCount,
          photos: photosCount,
          articles: articlesCount,
          unreadMessages: dialogsRequiringAnswer,
          psychologistComplaints,
        },
        problematicLeads: {
          noResponseOver2Days,
          noProgressOver10Days,
        },
        psychologists: {
          total: totalPsychologists,
          notVerified,
          verified,
          inCatalog,
          level1,
          level2,
          level3,
        },
        students: {
          enrolled,
          graduated,
        },
        statistics: {
          newPsychologists: {
            thisMonth: newPsychologistsThisMonth,
            thisWeek: newPsychologistsThisWeek,
            today: newPsychologistsToday,
          },
          clients: {
            total: totalLeads,
            thisMonth: leadsThisMonth,
            thisWeek: leadsThisWeek,
            today: leadsToday,
          },
        },
      },
    };
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    return { success: false, error: "Ошибка при получении статистики дашборда" };
  }
}