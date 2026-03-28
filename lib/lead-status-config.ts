import { LeadStatus } from "@prisma/client";

/**
 * Конфигурация кнопок действий для каждого статуса заявки
 */

export interface LeadAction {
  id: string;
  label: string;
  status: LeadStatus;
  variant: "success" | "danger" | "neutral" | "warning";
  icon?: string;
}

export interface LeadStatusConfig {
  label: string;
  color: "green" | "blue" | "yellow" | "red" | "gray" | "purple";
  actions: LeadAction[];
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "Новая",
  ACCEPTED: "Принята",
  REJECTED: "Отказано",
  CONTACTED: "Связался",
  APPOINTMENT: "Договорились",
  FREE_SESSION: "Бесплатная сессия",
  PAID_SESSION: "Платная сессия",
  NO_CONTACT: "Нет связи",
  CLIENT_REJECTED: "Клиент отказался",
  ARCHIVED: "В архиве",
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, "green" | "blue" | "yellow" | "red" | "gray" | "purple"> = {
  NEW: "green",
  ACCEPTED: "blue",
  REJECTED: "red",
  CONTACTED: "blue",
  APPOINTMENT: "blue",
  FREE_SESSION: "yellow",
  PAID_SESSION: "green",
  NO_CONTACT: "gray",
  CLIENT_REJECTED: "red",
  ARCHIVED: "gray",
};

export const LEAD_STATUS_ACTIONS: Record<LeadStatus, LeadAction[]> = {
  NEW: [
    { id: "accept", label: "Принять", status: LeadStatus.ACCEPTED, variant: "success", icon: "✅" },
    { id: "reject", label: "Отказаться", status: LeadStatus.REJECTED, variant: "danger", icon: "❌" },
  ],
  ACCEPTED: [
    { id: "contacted", label: "Связался", status: LeadStatus.CONTACTED, variant: "success", icon: "📞" },
    { id: "appointment", label: "Договорились", status: LeadStatus.APPOINTMENT, variant: "success", icon: "📅" },
    { id: "client_rejected", label: "Клиент отказался", status: LeadStatus.CLIENT_REJECTED, variant: "danger", icon: "👎" },
    { id: "archived", label: "В архив", status: LeadStatus.ARCHIVED, variant: "neutral", icon: "📦" },
  ],
  REJECTED: [],
  CONTACTED: [
    { id: "free_session", label: "Бесплатная сессия", status: LeadStatus.FREE_SESSION, variant: "success", icon: "💰" },
    { id: "paid_session", label: "Платная сессия", status: LeadStatus.PAID_SESSION, variant: "success", icon: "💵" },
    { id: "client_rejected", label: "Клиент отказался", status: LeadStatus.CLIENT_REJECTED, variant: "danger", icon: "👎" },
    { id: "archived", label: "В архив", status: LeadStatus.ARCHIVED, variant: "neutral", icon: "📦" },
  ],
  APPOINTMENT: [
    { id: "free_session", label: "Бесплатная сессия", status: LeadStatus.FREE_SESSION, variant: "success", icon: "💰" },
    { id: "paid_session", label: "Платная сессия", status: LeadStatus.PAID_SESSION, variant: "success", icon: "💵" },
    { id: "client_rejected", label: "Клиент отказался", status: LeadStatus.CLIENT_REJECTED, variant: "danger", icon: "👎" },
    { id: "archived", label: "В архив", status: LeadStatus.ARCHIVED, variant: "neutral", icon: "📦" },
  ],
  FREE_SESSION: [
    { id: "archived", label: "В архив", status: LeadStatus.ARCHIVED, variant: "neutral", icon: "📦" },
  ],
  PAID_SESSION: [
    { id: "archived", label: "В архив", status: LeadStatus.ARCHIVED, variant: "neutral", icon: "📦" },
  ],
  NO_CONTACT: [
    { id: "archived", label: "В архив", status: LeadStatus.ARCHIVED, variant: "neutral", icon: "📦" },
  ],
  CLIENT_REJECTED: [
    { id: "archived", label: "В архив", status: LeadStatus.ARCHIVED, variant: "neutral", icon: "📦" },
  ],
  ARCHIVED: [],
};

/**
 * Группы статусов для вкладок
 */
export const TAB_STATUS_MAP: Record<string, LeadStatus[]> = {
  new: [LeadStatus.NEW],
  accepted: [
    LeadStatus.ACCEPTED,
    LeadStatus.CONTACTED,
    LeadStatus.APPOINTMENT,
    LeadStatus.FREE_SESSION,
    LeadStatus.PAID_SESSION,
  ],
  archived: [
    LeadStatus.REJECTED,
    LeadStatus.NO_CONTACT,
    LeadStatus.CLIENT_REJECTED,
    LeadStatus.ARCHIVED,
  ],
};

/**
 * Названия вкладок
 */
export const TAB_LABELS: Record<string, string> = {
  new: "Новые",
  accepted: "Принятые",
  archived: "Архив",
};