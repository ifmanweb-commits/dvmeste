"use server";

import { prisma } from "@/lib/prisma";

// ==================== ИНТЕРФЕЙСЫ ====================

export interface CreateComplaintInput {
  fromType: "client" | "psychologist";
  fromId: string; // clientId или psychologistId
  toType: "client" | "psychologist";
  toId: string;
  reason: string;
  description?: string;
  leadId?: string;
}

// ==================== SERVER ACTIONS ====================

/**
 * Создание жалобы
 */
export async function createComplaint(
  data: CreateComplaintInput
): Promise<{ success: boolean; complaintId?: string; error?: string }> {
  try {
    // Валидация входных данных
    if (!data.fromType || !data.fromId || !data.toType || !data.toId || !data.reason) {
      return { success: false, error: "Не все обязательные поля заполнены" };
    }

    if (data.fromType === "client" && data.toType === "client") {
      return { success: false, error: "Клиент не может пожаловаться на клиента" };
    }

    if (data.fromType === "psychologist" && data.toType === "psychologist") {
      return { success: false, error: "Психолог не может пожаловаться на психолога" };
    }

    // Подготовка данных для создания жалобы
    const complaintData: any = {
      fromType: data.fromType,
      toType: data.toType,
      reason: data.reason,
      description: data.description || null,
      leadId: data.leadId || null,
    };

    // Установка полей в зависимости от типа отправителя
    if (data.fromType === "client") {
      complaintData.fromClientId = data.fromId;
    } else {
      complaintData.fromPsychologistId = data.fromId;
    }

    // Установка полей в зависимости от типа получателя жалобы
    if (data.toType === "client") {
      complaintData.toClientId = data.toId;
    } else {
      complaintData.toPsychologistId = data.toId;
    }

    // Создание жалобы
    const complaint = await prisma.complaint.create({
      data: complaintData,
    });

    // Если жалоба на клиента — увеличиваем complaintCount и проверяем на бан
    if (data.toType === "client") {
      await handleClientComplaint(data.toId);
    }

    return { success: true, complaintId: complaint.id };
  } catch (error) {
    console.error("Error creating complaint:", error);
    return { success: false, error: "Ошибка при создании жалобы" };
  }
}

/**
 * Обработка жалобы на клиента
 */
async function handleClientComplaint(clientId: string) {
  // Получаем клиента
  const client = await prisma.client.findUnique({
    where: { id: clientId },
  });

  if (!client) return;

  // Увеличиваем счетчик жалоб
  const newComplaintCount = client.complaintCount + 1;

  // Обновляем клиента
  await prisma.client.update({
    where: { id: clientId },
    data: {
      complaintCount: newComplaintCount,
      isShadowBanned: newComplaintCount >= 3,
    },
  });
}

/**
 * Получение жалобы по ID (для админки)
 */
export async function getComplaintById(
  complaintId: string
): Promise<{
  success: boolean;
  complaint?: {
    id: string;
    fromType: string;
    fromClientId: string | null;
    fromPsychologistId: string | null;
    toClientId: string | null;
    toPsychologistId: string | null;
    reason: string;
    description: string | null;
    leadId: string | null;
    createdAt: Date;
    resolvedAt: Date | null;
    resolvedBy: string | null;
    resolution: string | null;
    fromClient?: {
      id: string;
      email: string;
      name: string | null;
    } | null;
    fromPsychologist?: {
      id: string;
      email: string;
      fullName: string | null;
    } | null;
    toClient?: {
      id: string;
      email: string;
      name: string | null;
    } | null;
    toPsychologist?: {
      id: string;
      email: string;
      fullName: string | null;
    } | null;
    lead?: {
      id: string;
      message: string | null;
      status: string;
    } | null;
  };
  error?: string;
}> {
  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: {
        fromClient: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        fromPsychologist: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        toClient: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        toPsychologist: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        lead: {
          select: {
            id: true,
            message: true,
            status: true,
          },
        },
      },
    });

    if (!complaint) {
      return { success: false, error: "Жалоба не найдена" };
    }

    return {
      success: true,
      complaint: {
        id: complaint.id,
        fromType: complaint.fromType,
        fromClientId: complaint.fromClientId,
        fromPsychologistId: complaint.fromPsychologistId,
        toClientId: complaint.toClientId,
        toPsychologistId: complaint.toPsychologistId,
        reason: complaint.reason,
        description: complaint.description,
        leadId: complaint.leadId,
        createdAt: complaint.createdAt,
        resolvedAt: complaint.resolvedAt,
        resolvedBy: complaint.resolvedBy,
        resolution: complaint.resolution,
        fromClient: complaint.fromClient,
        fromPsychologist: complaint.fromPsychologist,
        toClient: complaint.toClient,
        toPsychologist: complaint.toPsychologist,
        lead: complaint.lead,
      },
    };
  } catch (error) {
    console.error("Error getting complaint by id:", error);
    return { success: false, error: "Ошибка при получении жалобы" };
  }
}

/**
 * Разрешение жалобы (для админки)
 */
export async function resolveComplaint(
  complaintId: string,
  resolution: string,
  resolvedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        resolvedAt: new Date(),
        resolvedBy,
        resolution,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error resolving complaint:", error);
    return { success: false, error: "Ошибка при разрешении жалобы" };
  }
}

/**
 * Получение списка жалоб для админки
 */
export async function getComplaintsForAdmin(
  filters: {
    page?: number;
    limit?: number;
    resolved?: boolean;
    fromType?: string;
    toType?: string;
  } = {}
): Promise<{
  success: boolean;
  complaints?: any[];
  total?: number;
  page?: number;
  limit?: number;
  error?: string;
}> {
  try {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.resolved !== undefined) {
      where.resolvedAt = filters.resolved ? { not: null } : null;
    }

    if (filters.fromType) {
      where.fromType = filters.fromType;
    }

    if (filters.toType) {
      where.toType = filters.toType;
    }

    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        include: {
          fromClient: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          fromPsychologist: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
          toClient: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          toPsychologist: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
          lead: {
            select: {
              id: true,
              message: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.complaint.count({ where }),
    ]);

    return {
      success: true,
      complaints,
      total,
      page,
      limit,
    };
  } catch (error) {
    console.error("Error getting complaints for admin:", error);
    return { success: false, error: "Ошибка при получении жалоб" };
  }
}