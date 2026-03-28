"use server";

import { prisma } from "@/lib/prisma";
import { hashEmail } from "@/lib/utils/hash-email";
import { getClientIpFromRequest } from "@/lib/utils/get-client-ip";
import { emailService } from "@/lib/email.service";
import { cookies } from "next/headers";
import { LeadStatus } from "@prisma/client";

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

export interface UpdateLeadData {
  clientReason?: string;
  internalReason?: string;
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
): Promise<{ success: boolean; leadId?: string; error?: string }> {
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

    // 7. Создание заявки
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

    // 8. Установка cookie clientId если rememberMe
    if (data.rememberMe) {
      const cookieStore = await cookies();
      cookieStore.set("clientId", client.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 дней
        path: "/",
      });
    }

    // 9. Отправка уведомлений психологу
    try {
      await sendLeadNotifications(lead);
    } catch (notifyError) {
      console.error("Error sending notifications:", notifyError);
      // Не блокируем создание заявки при ошибке уведомления
    }

    return { success: true, leadId: lead.id };
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
 * Обновление статуса заявки
 */
export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus,
  psychologistId: string,
  data?: UpdateLeadData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Проверка, что заявка принадлежит психологу
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

    // Обновление статуса
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status,
        statusChangedAt: new Date(),
      },
    });

    // Если статус REJECTED и есть clientReason — отправляем письмо клиенту
    if (status === LeadStatus.REJECTED && data?.clientReason && lead.client.email) {
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