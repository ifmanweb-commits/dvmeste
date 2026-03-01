export const FOOTER_PAGE_SLUG = "site-footer";
export const FOOTER_PAGE_TITLE = "Футер сайта";

   
                                                               
                                                  
                                                                   
   
export const FOOTER_DEFAULT_CONTENT = `
<div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
  <div class="flex flex-col items-center gap-6 sm:flex-row sm:justify-between sm:gap-8">
    <div class="text-center sm:text-left">
      <div class="text-xl font-bold text-gray-900">Давай вместе</div>
      <div class="mt-1 text-xs font-medium text-lime-600">реестр психологов</div>
    </div>

    <nav class="flex flex-wrap justify-center gap-6">
      <a href="/" class="text-sm text-gray-600 hover:text-gray-900">Главная</a>
      <a href="/psy-list" class="text-sm text-gray-600 hover:text-gray-900">Каталог</a>
      <a href="/lib" class="text-sm text-gray-600 hover:text-gray-900">Библиотека</a>
      <a href="/connect" class="text-sm text-gray-600 hover:text-gray-900">Для психологов</a>
      <a href="/contacts" class="text-sm text-gray-600 hover:text-gray-900">Контакты</a>
    </nav>
  </div>

  <div class="my-6 h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

  <div class="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
    <div class="flex flex-wrap justify-center gap-4 text-xs">
      <a href="/privacy" class="text-gray-500 hover:text-gray-700">Конфиденциальность</a>
      <a href="/complaint" class="text-gray-500 hover:text-gray-700">Пожаловаться</a>
      <a href="/faq" class="text-gray-500 hover:text-gray-700">FAQ</a>
    </div>

    <div class="text-center sm:text-right">
      <p class="text-xs text-gray-500">© {{year}} Давай вместе. Каталог психологов.</p>
      <p class="mt-1 text-xs text-gray-400">Подбор по парадигме, цене и городу.</p>
    </div>
  </div>

  <div class="mt-6 flex justify-center">
    <div class="flex items-center gap-2">
      <div class="h-px w-4 bg-gray-300"></div>
      <div class="h-1 w-1 rounded-full bg-lime-500"></div>
      <div class="h-px w-4 bg-gray-300"></div>
    </div>
  </div>
</div>
`.trim();

const FOOTER_FALLBACK_MENU_HTML = [
  '<a href="/" class="text-sm text-gray-600 hover:text-gray-900">Главная</a>',
  '<a href="/psy-list" class="text-sm text-gray-600 hover:text-gray-900">Каталог</a>',
  '<a href="/lib" class="text-sm text-gray-600 hover:text-gray-900">Библиотека</a>',
  '<a href="/connect" class="text-sm text-gray-600 hover:text-gray-900">Для психологов</a>',
  '<a href="/contacts" class="text-sm text-gray-600 hover:text-gray-900">Контакты</a>',
].join("\n");

export function applyFooterTokens(content: string): string {
  return content
    .replace(/\{\{\s*year\s*\}\}/gi, String(new Date().getFullYear()))
    .replace(/\{\{\s*site_menu\s*\}\}/gi, FOOTER_FALLBACK_MENU_HTML);
}
