"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require";
import { hashEmail } from "@/lib/utils/hash-email";

export interface ClientFilters {
  page?: number;
  limit?: number;
  search?: string; // email для поиска
  complaintCountFrom?: number;
  isShadowBanned?: boolean;
  sortBy?: "createdAt" | "complaintCount";
  sortOrder?: "asc" | "desc";
}

export interface ClientItem {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  complaintCount: number;
  isShadowBanned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Получить список клиентов с фильтрами и пагинацией
 */
export async function getClients(filters: ClientFilters = {}) {
  try {
    await requireAdmin();

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Поиск по email (через emailHash)
    if (filters.search) {
      const emailHash = hashEmail(filters.search.trim());
      where.emailHash = emailHash;
    }

    // Фильтр по количеству жалоб
    if (filters.complaintCountFrom !== undefined && filters.complaintCountFrom > 0) {
      where.complaintCount = { gte: filters.complaintCountFrom };
    }

    // Фильтр по теневому бану
    if (filters.isShadowBanned !== undefined) {
      where.isShadowBanned = filters.isShadowBanned;
    }

    // Сортировка
    const sortBy = filters.sortBy || "createdAt";
    const sortOrder = filters.sortOrder || "desc";

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.client.count({ where }),
    ]);

    // prisma-field-encryption автоматически расшифровывает поле email
    const decryptedClients: ClientItem[] = clients.map((client) => ({
      id: client.id,
      email: client.email, // уже расшифровано prisma-field-encryption
      name: client.name,
      phone: client.phone,
      complaintCount: client.complaintCount,
      isShadowBanned: client.isShadowBanned,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    }));

    return {
      success: true,
      data: {
        clients: decryptedClients,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + clients.length < total,
          total,
        },
      },
    };
  } catch (error) {
    console.error("Error getting clients:", error);
    return { success: false, error: "Ошибка при получении клиентов", data: null };
  }
}

/**
 * Получить данные клиента для детальной страницы
 */
export async function getClientById(clientId: string) {
  try {
    await requireAdmin();

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        leads: {
          include: {
            psychologist: {
              select: {
                id: true,
                fullName: true,
                email: true,
                slug: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        complaintsTo: {
          include: {
            fromPsychologist: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
            fromClient: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
            lead: {
              select: {
                id: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        complaintsFrom: {
          include: {
            toPsychologist: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
            toClient: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!client) {
      return { success: false, error: "Клиент не найден" };
    }

    return {
      success: true,
      data: {
        client: {
          id: client.id,
          email: client.email,
          name: client.name,
          phone: client.phone,
          telegram: client.telegram,
          vk: client.vk,
          complaintCount: client.complaintCount,
          isShadowBanned: client.isShadowBanned,
          createdAt: client.createdAt,
          updatedAt: client.updatedAt,
        },
        leads: client.leads.map((lead) => ({
          id: lead.id,
          message: lead.message,
          status: lead.status,
          resolution: lead.resolution,
          isSuspicious: lead.isSuspicious,
          suspiciousReason: lead.suspiciousReason,
          createdAt: lead.createdAt,
          viewedAt: lead.viewedAt,
          psychologist: lead.psychologist,
        })),
        complaintsTo: client.complaintsTo.map((c) => ({
          id: c.id,
          reason: c.reason,
          description: c.description,
          createdAt: c.createdAt,
          resolvedAt: c.resolvedAt,
          resolution: c.resolution,
          fromType: c.fromType,
          fromPsychologist: c.fromPsychologist,
          fromClient: c.fromClient,
          lead: c.lead,
        })),
        complaintsFrom: client.complaintsFrom.map((c) => ({
          id: c.id,
          reason: c.reason,
          description: c.description,
          createdAt: c.createdAt,
          toPsychologist: c.toPsychologist,
          toClient: c.toClient,
        })),
        stats: {
          totalLeads: client.leads.length,
          totalComplaintsTo: client.complaintsTo.length,
          totalComplaintsFrom: client.complaintsFrom.length,
          unresolvedComplaintsTo: client.complaintsTo.filter((c) => c.resolvedAt === null).length,
        },
      },
    };
  } catch (error) {
    console.error("Error getting client by id:", error);
    return { success: false, error: "Ошибка при получении данных клиента" };
  }
}

/**
 * Переключить теневой бан клиента
 */
export async function toggleClientShadowBan(clientId: string) {
  try {
    await requireAdmin();

    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return { success: false, error: "Клиент не найден" };
    }

    const newBanState = !client.isShadowBanned;

    await prisma.client.update({
      where: { id: clientId },
      data: {
        isShadowBanned: newBanState,
      },
    });

    return {
      success: true,
      message: newBanState ? "Клиент заблокирован" : "Клиент разблокирован",
    };
  } catch (error) {
    console.error("Error toggling shadow ban:", error);
    return { success: false, error: "Ошибка при изменении статуса бана" };
  }
}