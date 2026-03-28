import { LeadStatus, LeadResolution } from "@prisma/client";

/**
 * Конфигурация кнопок действий для каждого статуса заявки
 */

export interface LeadAction {
  id: string;
  label: string;
  status: LeadStatus;
  resolution?: LeadResolution;
  variant: "success" | "danger" | "neutral" | "warning";
  icon?: string;
  requiresModal?: boolean;
}

export interface LeadStatusConfig {
  label: string;
  color: "green" | "blue" | "yellow" | "red" | "gray" | "purple";
  actions: LeadAction[];
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "Новая",
  ACCEPTED: "Принята",
  COMPLETED: "Завершена",
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, "green" | "blue" | "yellow" | "red" | "gray" | "purple"> = {
  NEW: "green",
  ACCEPTED: "blue",
  COMPLETED: "gray",
};

export const RESOLUTION_LABELS: Record<LeadResolution, string> = {
  PSYCHOLOGIST_REJECTED: "Психолог отказал",
  NO_CONTACT: "Не удалось связаться",
  NO_AGREEMENT: "Связались, но не договорились",
  CLIENT_DROPPED: "Клиент пропал",
  FREE_ONLY: "Только бесплатная сессия",
  PAID_COMPLETED: "Были платные сессии",
};

export const RESOLUTION_COLORS: Record<LeadResolution, "green" | "blue" | "yellow" | "red" | "gray" | "purple"> = {
  PSYCHOLOGIST_REJECTED: "red",
  NO_CONTACT: "gray",
  NO_AGREEMENT: "yellow",
  CLIENT_DROPPED: "yellow",
  FREE_ONLY: "blue",
  PAID_COMPLETED: "green",
};

export const LEAD_STATUS_ACTIONS: Record<LeadStatus, LeadAction[]> = {
  NEW: [
    { id: "accept", label: "Принять", status: LeadStatus.ACCEPTED, variant: "success", icon: "✅" },
    { id: "reject", label: "Отказаться", status: LeadStatus.COMPLETED, resolution: LeadResolution.PSYCHOLOGIST_REJECTED, variant: "danger", icon: "❌", requiresModal: true },
  ],
  ACCEPTED: [
    { id: "complete", label: "Завершить", status: LeadStatus.COMPLETED, variant: "neutral", icon: "📦", requiresModal: true },
  ],
  COMPLETED: [],
};

/**
 * Группы статусов для вкладок
 */
export const TAB_STATUS_MAP: Record<string, LeadStatus[]> = {
  new: [LeadStatus.NEW],
  accepted: [LeadStatus.ACCEPTED],
  archived: [LeadStatus.COMPLETED],
};

/**
 * Названия вкладок
 */
export const TAB_LABELS: Record<string, string> = {
  new: "Новые",
  accepted: "Принятые",
  archived: "Архив",
};

/**
 * Опции resolution для модалки завершения
 */
export const RESOLUTION_OPTIONS: { value: LeadResolution; label: string; description: string }[] = [
  { value: LeadResolution.PSYCHOLOGIST_REJECTED, label: "Психолог отказал", description: "Отказ сразу после получения заявки" },
  { value: LeadResolution.NO_CONTACT, label: "Не удалось связаться", description: "Не удалось дозвониться/связаться с клиентом" },
  { value: LeadResolution.NO_AGREEMENT, label: "Связались, но не договорились", description: "Поговорили, но не подошли друг другу" },
  { value: LeadResolution.CLIENT_DROPPED, label: "Клиент пропал", description: "Договорились, но клиент не вышел на связь" },
  { value: LeadResolution.FREE_ONLY, label: "Только бесплатная сессия", description: "Клиент воспользовался только бесплатной сессией" },
  { value: LeadResolution.PAID_COMPLETED, label: "Были платные сессии", description: "Клиент оплатил одну или более сессий" },
];