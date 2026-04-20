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

export const SUPERADMIN_EMAIL = "ifman@yandex.ru";
