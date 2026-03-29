"use server";

import { prisma } from "@/lib/prisma";
import { hashEmail } from "@/lib/utils/hash-email";
import { getClientIpFromRequest } from "@/lib/utils/get-client-ip";
import { emailService } from "@/lib/email.service";
import { revalidatePath } from "next/cache";
import { LeadStatus, LeadResolution } from "@prisma/client";

// ==================== ИНТЕРФЕЙСЫ ====================

export interface CreateLeadInput {
  psychologistId: string;
  client: {
    email: string;
    name?: string;
    phone?: string;
    telegram?: string;
    vk?: string;
  };
  message: string;
  rememberMe?: boolean;
  consent: boolean;
}

export interface LeadFilters {
  status?: LeadStatus;
  statuses?: LeadStatus[]; // Для фильтрации по нескольким статусам (вкладки)
  page?: number;
  limit?: number;
}

// Интерфейсы для админки
export interface AdminLeadFilters {
  search?: string; // email клиента или имя психолога
  status?: LeadStatus;
  statuses?: LeadStatus[];
  resolution?: LeadResolution;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sort?: 'asc' | 'desc';
}

export interface LeadStats {
  total: number;
  new: number;
  accepted: number;
  completed: number;
  suspicious: number;
}

export interface UpdateLeadData {
  clientReason?: string;
  internalReason?: string;
  resolution?: LeadResolution;
}

// Тип для клиента с complaintCount
export interface ClientWithComplaintCount {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  telegram: string | null;
  vk: string | null;
  complaintCount: number;
}

// ==================== SERVER ACTIONS ====================

/**
 * Создание новой заявки от клиента
 */
export async function createLead(
  data: CreateLeadInput,
  request: Request
): Promise<{ success: boolean; leadId?: string; clientId?: string; error?: string }> {
  try {
    // 1. Проверка согласия на обработку ПД
    if (!data.consent) {
      return { success: false, error: "Необходимо согласие на обработку персональных данных" };
    }

    // 2. Получение IP адреса
    const ipAddress = getClientIpFromRequest(request);

    // 3. Проверка лимита заявок (не больше 5 за последний час с этого email + IP)
    const emailHash = hashEmail(data.client.email);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentLeadsCount = await prisma.lead.count({
      where: {
        client: {
          emailHash: emailHash,
        },
        createdAt: {
          gte: oneHourAgo,
        },
      },
    });

    if (recentLeadsCount >= 5) {
      return {
        success: false,
        error: "Слишком много заявок. Попробуйте позже",
      };
    }

    // 4. Поиск клиента по emailHash
    let client = await prisma.client.findUnique({
      where: { emailHash },
    });

    // 5. Если клиент не найден — создаём нового
    if (!client) {
      client = await prisma.client.create({
        data: {
          email: data.client.email,
          emailHash,
          name: data.client.name || null,
          phone: data.client.phone || null,
          telegram: data.client.telegram || null,
          vk: data.client.vk || null,
        },
      });
    }

    // 6. Проверка на shadow ban и suspicious статус
    let isSuspicious = false;
    let suspiciousReason: string | null = null;

    if (client.isShadowBanned) {
      isSuspicious = true;
      suspiciousReason = "Клиент в shadow ban";
    } else if (client.complaintCount >= 3) {
      isSuspicious = true;
      suspiciousReason = `Много жалоб (${client.complaintCount})`;
    }

    // 7. Обновление данных клиента если они изменились
    const updateClientData: any = {};
    if (data.client.name && client.name !== data.client.name) {
      updateClientData.name = data.client.name;
    }
    if (data.client.phone && client.phone !== data.client.phone) {
      updateClientData.phone = data.client.phone;
    }
    if (data.client.telegram && client.telegram !== data.client.telegram) {
      updateClientData.telegram = data.client.telegram;
    }
    if (data.client.vk && client.vk !== data.client.vk) {
      updateClientData.vk = data.client.vk;
    }

    if (Object.keys(updateClientData).length > 0) {
      client = await prisma.client.update({
        where: { id: client.id },
        data: updateClientData,
      });
    }

    // 8. Создание заявки
    const lead = await prisma.lead.create({
      data: {
        clientId: client.id,
        psychologistId: data.psychologistId,
        message: data.message,
        status: LeadStatus.NEW,
        isSuspicious,
        suspiciousReason,
        ipAddress,
      },
      include: {
        client: true,
        psychologist: true,
      },
    });

    // 9. Отправка уведомлений психологу
    try {
      await sendLeadNotifications(lead);
    } catch (notifyError) {
      console.error("Error sending notifications:", notifyError);
      // Не блокируем создание заявки при ошибке уведомления
    }

    return { success: true, leadId: lead.id, clientId: client.id };
  } catch (error) {
    console.error("Error creating lead:", error);
    return { success: false, error: "Ошибка при создании заявки" };
  }
}

/**
 * Получение списка заявок психолога с пагинацией
 */
export async function getPsychologistLeads(
  psychologistId: string,
  filters: LeadFilters = {}
): Promise<{
  success: boolean;
  leads?: Array<{
    id: string;
    client: ClientWithComplaintCount;
    message: string | null;
    status: LeadStatus;
    isSuspicious: boolean;
    suspiciousReason: string | null;
    createdAt: Date;
    viewedAt: Date | null;
    statusChangedAt: Date | null;
  }>;
  total?: number;
  page?: number;
  limit?: number;
  error?: string;
}> {
  try {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      psychologistId,
    };

    if (filters.status) {
      where.status = filters.status;
    } else if (filters.statuses && filters.statuses.length > 0) {
      where.status = { in: filters.statuses };
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
              telegram: true,
              vk: true,
              complaintCount: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.lead.count({ where }),
    ]);

    return {
      success: true,
      leads: leads.map((lead) => ({
        id: lead.id,
        client: lead.client,
        message: lead.message,
        status: lead.status,
        isSuspicious: lead.isSuspicious,
        suspiciousReason: lead.suspiciousReason,
        createdAt: lead.createdAt,
        viewedAt: lead.viewedAt,
        statusChangedAt: lead.statusChangedAt,
      })),
      total,
      page,
      limit,
    };
  } catch (error) {
    console.error("Error getting psychologist leads:", error);
    return { success: false, error: "Ошибка при получении заявок" };
  }
}

/**
 * Получение детальной информации о заявке
 */
export async function getLeadById(
  leadId: string,
  psychologistId: string
): Promise<{
  success: boolean;
  lead?: {
    id: string;
    client: ClientWithComplaintCount;
    message: string | null;
    status: LeadStatus;
    isSuspicious: boolean;
    suspiciousReason: string | null;
    createdAt: Date;
    viewedAt: Date | null;
    statusChangedAt: Date | null;
  };
  error?: string;
}> {
  try {
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        psychologistId,
      },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            telegram: true,
            vk: true,
            complaintCount: true,
          },
        },
      },
    });

    if (!lead) {
      return { success: false, error: "Заявка не найдена" };
    }

    return {
      success: true,
      lead: {
        id: lead.id,
        client: lead.client,
        message: lead.message,
        status: lead.status,
        isSuspicious: lead.isSuspicious,
        suspiciousReason: lead.suspiciousReason,
        createdAt: lead.createdAt,
        viewedAt: lead.viewedAt,
        statusChangedAt: lead.statusChangedAt,
      },
    };
  } catch (error) {
    console.error("Error getting lead by id:", error);
    return { success: false, error: "Ошибка при получении заявки" };
  }
}

/**
 * Принять заявку
 */
export async function acceptLead(
  leadId: string,
  psychologistId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        psychologistId,
      },
    });

    if (!lead) {
      return { success: false, error: "Заявка не найдена" };
    }

    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: LeadStatus.ACCEPTED,
        statusChangedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error accepting lead:", error);
    return { success: false, error: "Ошибка при принятии заявки" };
  }
}

/**
 * Отказаться от заявки
 */
export async function rejectLead(
  leadId: string,
  psychologistId: string,
  data?: UpdateLeadData
): Promise<{ success: boolean; error?: string }> {
  try {
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        psychologistId,
      },
      include: {
        client: true,
      },
    });

    if (!lead) {
      return { success: false, error: "Заявка не найдена" };
    }

    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: LeadStatus.COMPLETED,
        resolution: LeadResolution.PSYCHOLOGIST_REJECTED,
        statusChangedAt: new Date(),
      },
    });

    // Отправляем письмо клиенту если есть причина
    if (data?.clientReason && lead.client.email) {
      try {
        await sendRejectionEmail(lead.client.email, data.clientReason);
      } catch (emailError) {
        console.error("Error sending rejection email:", emailError);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error rejecting lead:", error);
    return { success: false, error: "Ошибка при отказе от заявки" };
  }
}

/**
 * Завершить заявку с указанием resolution
 */
export async function completeLead(
  leadId: string,
  psychologistId: string,
  resolution: LeadResolution
): Promise<{ success: boolean; error?: string }> {
  try {
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        psychologistId,
      },
    });

    if (!lead) {
      return { success: false, error: "Заявка не найдена" };
    }

    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: LeadStatus.COMPLETED,
        resolution,
        statusChangedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error completing lead:", error);
    return { success: false, error: "Ошибка при завершении заявки" };
  }
}

/**
 * Обновление статуса заявки (обратная совместимость)
 */
export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus,
  psychologistId: string,
  data?: UpdateLeadData
): Promise<{ success: boolean; error?: string }> {
  try {
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        psychologistId,
      },
      include: {
        client: true,
      },
    });

    if (!lead) {
      return { success: false, error: "Заявка не найдена" };
    }

    const updateData: any = {
      status,
      statusChangedAt: new Date(),
    };

    if (data?.resolution) {
      updateData.resolution = data.resolution;
    }

    await prisma.lead.update({
      where: { id: leadId },
      data: updateData,
    });

    // Если статус COMPLETED и есть clientReason — отправляем письмо клиенту
    if (status === LeadStatus.COMPLETED && data?.clientReason && lead.client.email) {
      try {
        await sendRejectionEmail(lead.client.email, data.clientReason);
      } catch (emailError) {
        console.error("Error sending rejection email:", emailError);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating lead status:", error);
    return { success: false, error: "Ошибка при обновлении статуса" };
  }
}

/**
 * Отметка заявки как просмотренной
 */
export async function viewLead(leadId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        viewedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error marking lead as viewed:", error);
    return { success: false, error: "Ошибка при отметке заявки" };
  }
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

/**
 * Отправка уведомлений психологу о новой заявке
 */
async function sendLeadNotifications(lead: any) {
  const psychologist = lead.psychologist;

  if (!psychologist) return;

  // Email уведомление
  if (psychologist.email && !psychologist.unsubscribed) {
    await sendLeadEmailNotification(psychologist.email, lead);
  }

  // Push уведомление
  await sendLeadPushNotification(psychologist.id, lead);

  // Запись в таблицу уведомлений
  await createLeadNotificationRecord(psychologist.id, lead.id);
}

/**
 * Отправка email уведомления о новой заявке
 */
async function sendLeadEmailNotification(psychologistEmail: string, lead: any) {
  const clientName = lead.client.name || "Клиент";
  const clientEmail = lead.client.email;

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Новая заявка</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #5858E2; border-bottom: 2px solid #5858E2; padding-bottom: 10px;">Новая заявка от клиента</h2>
    <p><strong>Имя:</strong> ${clientName}</p>
    <p><strong>Email:</strong> ${clientEmail}</p>
    ${lead.client.phone ? `<p><strong>Телефон:</strong> ${lead.client.phone}</p>` : ""}
    ${lead.client.telegram ? `<p><strong>Telegram:</strong> ${lead.client.telegram}</p>` : ""}
    ${lead.message ? `<p><strong>Сообщение:</strong><br>${lead.message}</p>` : ""}
    <p style="margin-top: 30px;">
      <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/account/leads" 
         style="background-color: #5858E2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
        Перейти к заявкам
      </a>
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    <p style="color: #777; font-size: 14px;">Это письмо отправлено автоматически.</p>
  </body>
</html>
  `;

  await emailService.sendEmail({
    to: psychologistEmail,
    subject: "📬 Новая заявка от клиента",
    html,
  });
}

/**
 * Отправка email уведомления об отказе
 */
async function sendRejectionEmail(clientEmail: string, reason: string) {
  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Ответ на заявку</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #5858E2; border-bottom: 2px solid #5858E2; padding-bottom: 10px;">Ответ на вашу заявку</h2>
    <p>Здравствуйте!</p>
    <p>К сожалению, психолог не смог принять вашу заявку.</p>
    <p style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <strong>Причина:</strong><br>
      ${reason}
    </p>
    <p>Вы можете подать заявку другому специалисту из каталога.</p>
    <p style="margin-top: 30px;">
      <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/catalog" 
         style="background-color: #5858E2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
        Перейти в каталог
      </a>
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    <p style="color: #777; font-size: 14px;">Это письмо отправлено автоматически.</p>
  </body>
</html>
  `;

  await emailService.sendEmail({
    to: clientEmail,
    subject: "Ответ на вашу заявку",
    html,
  });
}

/**
 * Отправка push уведомления о новой заявке
 */
async function sendLeadPushNotification(psychologistId: string, lead: any) {
  try {
    const webPush = await import("web-push");

    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn("VAPID keys not configured");
      return;
    }

    webPush.setVapidDetails(
      "mailto:admin@dvmeste.ru",
      vapidPublicKey,
      vapidPrivateKey
    );

    // Получаем подписки психолога
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: psychologistId },
    });

    const notificationPayload = JSON.stringify({
      title: "📬 Новая заявка",
      body: `Заявка от ${lead.client.name || "клиента"}`,
      url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/account/leads`,
      icon: "/icon.png",
    });

    // Отправляем push каждой подписке
    for (const subscription of subscriptions) {
      try {
        await webPush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          notificationPayload
        );
      } catch (error: any) {
        // Если подписка недействительна — удаляем её
        if (error.statusCode === 410) {
          await prisma.pushSubscription.delete({
            where: { endpoint: subscription.endpoint },
          });
        }
      }
    }
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
}

/**
 * Создание записи уведомления в БД
 */
async function createLeadNotificationRecord(psychologistId: string, leadId: string) {
  try {
    await prisma.notification.create({
      data: {
        userId: psychologistId,
        type: "LEAD",
        title: "Новая заявка",
        message: "Клиент оставил заявку на консультацию",
        linkUrl: `/account/leads/${leadId}`,
        metadata: { leadId },
      },
    });
  } catch (error) {
    console.error("Error creating notification record:", error);
  }
}

// ==================== ADMIN SERVER ACTIONS ====================

/**
 * Получение списка заявок для админки с фильтрами и пагинацией
 */
export async function getAdminLeads(filters: AdminLeadFilters = {}) {
  try {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;
    const sort = filters.sort || 'desc';

    const where: any = {};

    // Поиск по email клиента или имени/email психолога
    if (filters.search) {
      where.OR = [
        {
          client: {
            email: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
        },
        {
          psychologist: {
            fullName: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
        },
        {
          psychologist: {
            email: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    // Фильтр по статусу
    if (filters.status) {
      where.status = filters.status;
    } else if (filters.statuses && filters.statuses.length > 0) {
      where.status = { in: filters.statuses };
    }

    // Фильтр по resolution
    if (filters.resolution) {
      where.resolution = filters.resolution;
    }

    // Фильтр по дате
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo);
      }
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              email: true,
              name: true,
              isShadowBanned: true,
            },
          },
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
          createdAt: sort,
        },
        skip,
        take: limit,
      }),
      prisma.lead.count({ where }),
    ]);

    return {
      success: true,
      data: {
        leads: leads.map((lead) => ({
          id: lead.id,
          clientId: lead.clientId,
          psychologistId: lead.psychologistId,
          message: lead.message,
          status: lead.status,
          resolution: lead.resolution,
          isSuspicious: lead.isSuspicious,
          suspiciousReason: lead.suspiciousReason,
          createdAt: lead.createdAt,
          viewedAt: lead.viewedAt,
          statusChangedAt: lead.statusChangedAt,
          client: {
            id: lead.client.id,
            email: lead.client.email,
            name: lead.client.name,
            isShadowBanned: lead.client.isShadowBanned,
          },
          psychologist: {
            id: lead.psychologist.id,
            fullName: lead.psychologist.fullName,
            email: lead.psychologist.email,
            slug: lead.psychologist.slug,
          },
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + leads.length < total,
          total,
        },
      },
    };
  } catch (error) {
    console.error("Error getting admin leads:", error);
    return { success: false, error: "Ошибка при получении заявок", data: null };
  }
}

/**
 * Пометить заявку как подозрительную (для form action)
 */
export async function markLeadAsSuspicious(formData: FormData): Promise<void> {
  const { requireAdmin } = await import("@/lib/auth/require");
  await requireAdmin();

  const leadId = formData.get("leadId") as string;
  if (!leadId) {
    throw new Error("Не указан ID заявки");
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      isSuspicious: true,
      suspiciousReason: "Помечено модератором",
    },
  });

  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${leadId}`);
}

/**
 * Теневой бан клиента (для form action)
 */
export async function shadowBanClient(formData: FormData): Promise<void> {
  const { requireAdmin } = await import("@/lib/auth/require");
  await requireAdmin();

  const clientId = formData.get("clientId") as string;
  if (!clientId) {
    throw new Error("Не указан ID клиента");
  }

  await prisma.client.update({
    where: { id: clientId },
    data: {
      isShadowBanned: true,
    },
  });

  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${clientId}`);
}

/**
 * Получить заявку по ID для админки
 */
export async function getAdminLeadById(leadId: string) {
  try {
    const { requireAdmin } = await import("@/lib/auth/require");
    await requireAdmin();

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            telegram: true,
            vk: true,
            isShadowBanned: true,
            complaintCount: true,
            createdAt: true,
          },
        },
        psychologist: {
          select: {
            id: true,
            fullName: true,
            email: true,
            slug: true,
          },
        },
      },
    });

    if (!lead) {
      return { success: false, error: "Заявка не найдена", data: null };
    }

    return {
      success: true,
      data: {
        id: lead.id,
        clientId: lead.clientId,
        psychologistId: lead.psychologistId,
        message: lead.message,
        status: lead.status,
        resolution: lead.resolution,
        isSuspicious: lead.isSuspicious,
        suspiciousReason: lead.suspiciousReason,
        createdAt: lead.createdAt,
        viewedAt: lead.viewedAt,
        statusChangedAt: lead.statusChangedAt,
        client: {
          id: lead.client.id,
          email: lead.client.email,
          name: lead.client.name,
          phone: lead.client.phone,
          telegram: lead.client.telegram,
          vk: lead.client.vk,
          isShadowBanned: lead.client.isShadowBanned,
          complaintCount: lead.client.complaintCount,
          createdAt: lead.client.createdAt,
        },
        psychologist: {
          id: lead.psychologist.id,
          fullName: lead.psychologist.fullName,
          email: lead.psychologist.email,
          slug: lead.psychologist.slug,
        },
      },
    };
  } catch (error) {
    console.error("Error getting admin lead by id:", error);
    return { success: false, error: "Ошибка при получении заявки", data: null };
  }
}

/**
 * Получить статистику заявок
 */
export async function getLeadStats(filters?: AdminLeadFilters): Promise<{ success: boolean; stats?: LeadStats; error?: string }> {
  try {
    const where: any = {};

    // Применяем фильтры если есть
    if (filters) {
      if (filters.status) {
        where.status = filters.status;
      }
      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) {
          where.createdAt.gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          where.createdAt.lte = new Date(filters.dateTo);
        }
      }
    }

    const [total, newCount, acceptedCount, completedCount, suspiciousCount] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.count({ where: { ...where, status: LeadStatus.NEW } }),
      prisma.lead.count({ where: { ...where, status: LeadStatus.ACCEPTED } }),
      prisma.lead.count({ where: { ...where, status: LeadStatus.COMPLETED } }),
      prisma.lead.count({ where: { ...where, isSuspicious: true } }),
    ]);

    return {
      success: true,
      stats: {
        total,
        new: newCount,
        accepted: acceptedCount,
        completed: completedCount,
        suspicious: suspiciousCount,
      },
    };
  } catch (error) {
    console.error("Error getting lead stats:", error);
    return { success: false, error: "Ошибка при получении статистики" };
  }
}

/**
 * Получить ID диалога психолога для сообщений
 */
export async function getPsychologistDialogId(psychologistId: string): Promise<{ success: boolean; dialogId?: string; error?: string }> {
  try {
    // Ищем существующий диалог психолога
    const dialog = await prisma.dialog.findUnique({
      where: { userId: psychologistId },
    });

    if (!dialog) {
      // Если диалога нет — создаём новый
      const newDialog = await prisma.dialog.create({
        data: {
          userId: psychologistId,
          status: "WAITING",
        },
      });
      return { success: true, dialogId: newDialog.id };
    }

    return { success: true, dialogId: dialog.id };
  } catch (error) {
    console.error("Error getting psychologist dialog:", error);
    return { success: false, error: "Ошибка при получении диалога" };
  }
}
