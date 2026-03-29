"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require";
import { hashEmail } from "@/lib/utils/hash-email";

export interface ComplaintFilters {
  page?: number;
  limit?: number;
  search?: string; // email, ID или имя
  psychologistId?: string;
  clientId?: string;
}

export interface ComplaintItem {
  id: string;
  fromType: string;
  fromClient: { id: string; email: string; name: string | null } | null;
  fromPsychologist: { id: string; fullName: string | null; email: string } | null;
  toClient: { id: string; email: string; name: string | null } | null;
  toPsychologist: { id: string; fullName: string | null; email: string } | null;
  reason: string;
  description: string | null;
  lead: { id: string } | null;
  createdAt: Date;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  resolution: string | null;
}

/**
 * Получить жалобы на клиентов
 */
export async function getComplaintsAgainstClients(filters: ComplaintFilters = {}) {
  try {
    await requireAdmin();

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {
      toClientId: { not: null },
    };

    // Поиск по психологу (кто жалуется)
    if (filters.psychologistId) {
      where.fromPsychologistId = filters.psychologistId;
    }

    // Поиск по клиенту (на кого жалуются)
    if (filters.clientId) {
      where.toClientId = filters.clientId;
    }

    // Общий поиск
    if (filters.search) {
      const searchValue = filters.search.trim();
      
      // Проверяем, является ли поиск email
      const emailHash = hashEmail(searchValue);
      
      // Поиск по email психолога или клиента
      const emailWhere = {
        OR: [
          { fromPsychologist: { emailHash: emailHash } },
          { toClient: { emailHash: emailHash } },
        ],
      };

      // Поиск по ID
      const idWhere = {
        OR: [
          { fromPsychologistId: searchValue },
          { toClientId: searchValue },
        ],
      };

      // Поиск по имени психолога (contains)
      const nameWhere = {
        fromPsychologist: {
          fullName: {
            contains: searchValue,
            mode: "insensitive" as const,
          },
        },
      };

      where.OR = [emailWhere, idWhere, nameWhere];
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
          toPsychologist: {
            select: {
              id: true,
              fullName: true,
              email: true,
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
        skip,
        take: limit,
      }),
      prisma.complaint.count({ where }),
    ]);

    return {
      success: true,
      data: {
        complaints: complaints.map((c) => ({
          id: c.id,
          fromType: c.fromType,
          fromClient: c.fromClient,
          fromPsychologist: c.fromPsychologist,
          toClient: c.toClient,
          toPsychologist: c.toPsychologist,
          reason: c.reason,
          description: c.description,
          lead: c.lead,
          createdAt: c.createdAt,
          resolvedAt: c.resolvedAt,
          resolvedBy: c.resolvedBy,
          resolution: c.resolution,
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + complaints.length < total,
          total,
        },
      },
    };
  } catch (error) {
    console.error("Error getting complaints against clients:", error);
    return { success: false, error: "Ошибка при получении жалоб", data: null };
  }
}

/**
 * Получить психологов с жалобами (список для таблицы)
 */
export async function getPsychologistsWithComplaints(filters: ComplaintFilters = {}) {
  try {
    await requireAdmin();

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    // Получаем все жалобы на психологов (где toPsychologistId не null)
    // Группируем по психологу и считаем нерешённые жалобы
    const complaints = await prisma.complaint.findMany({
      where: {
        toPsychologistId: { not: null },
      },
      include: {
        toPsychologist: {
          select: {
            id: true,
            fullName: true,
            email: true,
            slug: true,
          },
        },
      },
    });

    // Группируем по психологу
    const psychologistMap = new Map<string, {
      id: string;
      fullName: string | null;
      email: string;
      slug: string | null;
      unresolvedComplaints: number;
      totalComplaints: number;
    }>();

    for (const complaint of complaints) {
      if (!complaint.toPsychologist) continue;
      
      const psyId = complaint.toPsychologist.id;
      const existing = psychologistMap.get(psyId);
      
      if (!existing) {
        psychologistMap.set(psyId, {
          id: psyId,
          fullName: complaint.toPsychologist.fullName,
          email: complaint.toPsychologist.email,
          slug: complaint.toPsychologist.slug,
          unresolvedComplaints: complaint.resolvedAt === null ? 1 : 0,
          totalComplaints: 1,
        });
      } else {
        if (complaint.resolvedAt === null) {
          existing.unresolvedComplaints += 1;
        }
        existing.totalComplaints += 1;
      }
    }

    // Получаем количество заявок для каждого психолога
    const psychologistIds = Array.from(psychologistMap.keys());
    const leadsCounts = await prisma.lead.groupBy({
      by: ['psychologistId'],
      where: {
        psychologistId: { in: psychologistIds },
      },
      _count: {
        id: true,
      },
    });

    const leadsMap = new Map(leadsCounts.map(lc => [lc.psychologistId, lc._count.id]));

    // Преобразуем в массив и добавляем количество заявок
    let psychologists = Array.from(psychologistMap.values()).map(psy => ({
      ...psy,
      leadsCount: leadsMap.get(psy.id) || 0,
    }));

    // Поиск
    if (filters.search) {
      const searchValue = filters.search.trim().toLowerCase();
      psychologists = psychologists.filter(psy => 
        psy.fullName?.toLowerCase().includes(searchValue) ||
        psy.email.toLowerCase().includes(searchValue) ||
        psy.id.toLowerCase().includes(searchValue)
      );
    }

    // Сортировка и пагинация
    const total = psychologists.length;
    psychologists = psychologists.slice(skip, skip + limit);

    return {
      success: true,
      data: {
        psychologists,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + psychologists.length < total,
          total,
        },
      },
    };
  } catch (error) {
    console.error("Error getting psychologists with complaints:", error);
    return { success: false, error: "Ошибка при получении психологов", data: null };
  }
}

/**
 * Получить жалобы конкретного психолога (все, включая решённые)
 */
export async function getPsychologistComplaints(psychologistId: string, filters: ComplaintFilters = {}) {
  try {
    await requireAdmin();

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {
      toPsychologistId: psychologistId,
    };

    const [complaints, total, psychologist] = await Promise.all([
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
          toPsychologist: {
            select: {
              id: true,
              fullName: true,
              email: true,
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
        skip,
        take: limit,
      }),
      prisma.complaint.count({ where }),
      prisma.user.findUnique({
        where: { id: psychologistId },
        select: {
          id: true,
          fullName: true,
          email: true,
          slug: true,
        },
      }),
    ]);

    // Считаем количество заявок психолога
    const leadsCount = await prisma.lead.count({
      where: { psychologistId },
    });

    return {
      success: true,
      data: {
        psychologist: psychologist ? {
          id: psychologist.id,
          fullName: psychologist.fullName,
          email: psychologist.email,
          slug: psychologist.slug,
        } : null,
        complaints: complaints.map((c) => ({
          id: c.id,
          fromType: c.fromType,
          fromClient: c.fromClient,
          fromPsychologist: c.fromPsychologist,
          toClient: c.toClient,
          toPsychologist: c.toPsychologist,
          reason: c.reason,
          description: c.description,
          lead: c.lead,
          createdAt: c.createdAt,
          resolvedAt: c.resolvedAt,
          resolvedBy: c.resolvedBy,
          resolution: c.resolution,
        })),
        stats: {
          totalComplaints: total,
          unresolvedComplaints: complaints.filter(c => c.resolvedAt === null).length,
          leadsCount,
        },
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + complaints.length < total,
          total,
        },
      },
    };
  } catch (error) {
    console.error("Error getting psychologist complaints:", error);
    return { success: false, error: "Ошибка при получении жалоб психолога", data: null };
  }
}

/**
 * Удалить жалобу
 */
export async function deleteComplaint(complaintId: string) {
  try {
    await requireAdmin();

    await prisma.complaint.delete({
      where: { id: complaintId },
    });

    return { success: true, message: "Жалоба удалена" };
  } catch (error) {
    console.error("Error deleting complaint:", error);
    return { success: false, error: "Ошибка при удалении жалобы" };
  }
}

/**
 * Принять жалобу (установить resolved)
 */
export async function resolveComplaint(complaintId: string, resolution: string) {
  try {
    await requireAdmin();

    const session = await prisma.session.findFirst({
      include: { user: true },
    });
    
    const resolvedBy = session?.userId || null;

    await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        resolvedAt: new Date(),
        resolvedBy,
        resolution,
      },
    });

    return { success: true, message: "Жалоба принята" };
  } catch (error) {
    console.error("Error resolving complaint:", error);
    return { success: false, error: "Ошибка при принятии жалобы" };
  }
}

/**
 * Получить жалобы на психологов
 */
export async function getComplaintsAgainstPsychologists(filters: ComplaintFilters = {}) {
  try {
    await requireAdmin();

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {
      toPsychologistId: { not: null },
    };

    // Поиск по клиенту (кто жалуется)
    if (filters.clientId) {
      where.fromClientId = filters.clientId;
    }

    // Поиск по психологу (на кого жалуются)
    if (filters.psychologistId) {
      where.toPsychologistId = filters.psychologistId;
    }

    // Общий поиск
    if (filters.search) {
      const searchValue = filters.search.trim();
      
      // Проверяем, является ли поиск email
      const emailHash = hashEmail(searchValue);
      
      // Поиск по email клиента или психолога
      const emailWhere = {
        OR: [
          { fromClient: { emailHash: emailHash } },
          { toPsychologist: { emailHash: emailHash } },
        ],
      };

      // Поиск по ID
      const idWhere = {
        OR: [
          { fromClientId: searchValue },
          { toPsychologistId: searchValue },
        ],
      };

      // Поиск по имени психолога (contains)
      const nameWhere = {
        toPsychologist: {
          fullName: {
            contains: searchValue,
            mode: "insensitive" as const,
          },
        },
      };

      where.OR = [emailWhere, idWhere, nameWhere];
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
          toPsychologist: {
            select: {
              id: true,
              fullName: true,
              email: true,
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
        skip,
        take: limit,
      }),
      prisma.complaint.count({ where }),
    ]);

    return {
      success: true,
      data: {
        complaints: complaints.map((c) => ({
          id: c.id,
          fromType: c.fromType,
          fromClient: c.fromClient,
          fromPsychologist: c.fromPsychologist,
          toClient: c.toClient,
          toPsychologist: c.toPsychologist,
          reason: c.reason,
          description: c.description,
          lead: c.lead,
          createdAt: c.createdAt,
          resolvedAt: c.resolvedAt,
          resolvedBy: c.resolvedBy,
          resolution: c.resolution,
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + complaints.length < total,
          total,
        },
      },
    };
  } catch (error) {
    console.error("Error getting complaints against psychologists:", error);
    return { success: false, error: "Ошибка при получении жалоб", data: null };
  }
}