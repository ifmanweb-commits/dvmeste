export const FOOTER_PAGE_SLUG = "site-footer";
export const FOOTER_PAGE_TITLE = "Футер сайта";

const FOOTER_FALLBACK_MENU_HTML = [
  '<a href="/" class="text-sm text-gray-600 hover:text-gray-900">Главная</a>',
  '<a href="/catalog" class="text-sm text-gray-600 hover:text-gray-900">Каталог</a>',
  '<a href="/lib" class="text-sm text-gray-600 hover:text-gray-900">Библиотека</a>',
  '<a href="/connect" class="text-sm text-gray-600 hover:text-gray-900">Для психологов</a>',
  '<a href="/contacts" class="text-sm text-gray-600 hover:text-gray-900">Контакты</a>',
].join("\n");

export function applyFooterTokens(content: string): string {
  return content
    .replace(/\{\{\s*year\s*\}\}/gi, String(new Date().getFullYear()))
    .replace(/\{\{\s*site_menu\s*\}\}/gi, FOOTER_FALLBACK_MENU_HTML);
}
