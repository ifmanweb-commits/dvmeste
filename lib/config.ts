// ============================================
// КОНФИГУРАЦИЯ САЙТА
// ============================================

export const SITE = {
  name: "Давай вместе",
  shortName: "Давай вместе",
  description:
    "Подберите проверенного психолога без комиссии.",
  baseUrl:
    process.env.NEXT_PUBLIC_BASE_URL ?? "https://dvmeste.ru",
  locale: "ru_RU",
  twitterHandle: undefined as string | undefined,
} as const;

export type SiteConfig = typeof SITE;

// ============================================
// КОНФИГУРАЦИЯ КАТАЛОГА
// ============================================

export const CATALOG_PAGE_SIZE = 9;
export const CATALOG_PAGE_SIZE_MAX = 50;

// ============================================
// СУПЕРАДМИН
// ============================================

/**
 * Список email-адресов суперадминов
 * Добавить нового суперадмина — просто добавьте email в массив
 */
export const SUPERADMIN_EMAILS = [
  "ifman@yandex.ru",
  // Добавить других суперадминов здесь
] as const

/**
 * Проверяет, является ли email суперадмином
 */
export function isSuperAdmin(email: string): boolean {
  return SUPERADMIN_EMAILS.includes(email.toLowerCase().trim() as any)
}
