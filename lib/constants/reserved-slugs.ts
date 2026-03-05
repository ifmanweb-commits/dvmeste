// Зарезервированные системные адреса
export const RESERVED_SLUGS = [
  // Системные разделы
  'admin',
  'account',
  'auth',
  'api',
  
  // Публичные разделы
  'catalog',
  'articles',
  'uploads',
  
  // Системные страницы
  'login',
  'register',
  'verify',
  'logout',
  
  // Функциональные
  'sitemap',
  'robots',
  'favicon.ico',
  
  // Next.js служебные
  'next',
  '_next',
  'public',
  
  // Часто используемые (защита от случайного переопределения)
  'about',
  'contacts',
  'privacy',
  'terms',
  'offer',
  'payment',
  'delivery',
  
  // Методы HTTP
  'get',
  'post',
  'put',
  'delete',
  'patch',
  'head',
  'options',
] as const;

// Тип для TypeScript
export type ReservedSlug = typeof RESERVED_SLUGS[number];

// Проверка, зарезервирован ли slug
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug as ReservedSlug);
}

// Сделать slug безопасным (добавить суффикс)
export function makeSlugSafe(slug: string): string {
  if (!isReservedSlug(slug)) return slug;
  
  // Добавляем случайный суффикс
  const randomSuffix = Math.random().toString(36).slice(2, 6);
  return `${slug}-page-${randomSuffix}`;
}