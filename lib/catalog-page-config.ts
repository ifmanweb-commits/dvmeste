export const CATALOG_PAGE_SLUG = "catalog-page";
export const CATALOG_PAGE_TITLE = "Страница каталога";

type CatalogPagePayloadV1 = {
  version: 1;
  topHtml: string;
  bottomHtml: string;
};

export type CatalogPageSections = {
  topHtml: string;
  bottomHtml: string;
};

export const CATALOG_PAGE_DEFAULT_TOP_HTML = `
<section class="relative overflow-hidden border-b border-gray-200 bg-white">
  <div class="absolute left-0 top-0 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5858E2]/10 blur-3xl" aria-hidden="true"></div>
  <div class="absolute right-0 bottom-0 h-48 w-48 translate-x-1/2 translate-y-1/2 rounded-full bg-lime-500/10 blur-3xl" aria-hidden="true"></div>
  <div class="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
        Найдите <span class="text-[#5858E2]">психолога</span>
      </h1>
      <p class="mx-auto mt-6 max-w-2xl text-lg text-gray-700">
        Подбор специалистов по направлениям терапии, стоимости и опыту работы
      </p>
    </div>
  </div>
</section>
`.trim();

export const CATALOG_PAGE_DEFAULT_BOTTOM_HTML = `
<section class="border-t border-gray-200 bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
  <div class="mx-auto grid max-w-7xl gap-8 lg:grid-cols-3">
    <div class="rounded-2xl border border-gray-200 bg-gray-50 p-6">
      <h3 class="text-lg font-semibold text-gray-900">Проверенные специалисты</h3>
      <p class="mt-2 text-sm text-gray-600">
        Все психологи проходят проверку документов и квалификации.
      </p>
    </div>
    <div class="rounded-2xl border border-gray-200 bg-gray-50 p-6">
      <h3 class="text-lg font-semibold text-gray-900">Уровни сертификации</h3>
      <p class="mt-2 text-sm text-gray-600">
        Прозрачная система оценки опыта и профессиональной подготовки.
      </p>
    </div>
    <div class="rounded-2xl border border-gray-200 bg-gray-50 p-6">
      <h3 class="text-lg font-semibold text-gray-900">Помощь с выбором</h3>
      <p class="mt-2 text-sm text-gray-600">
        Если сложно выбрать, свяжитесь с нами и мы подскажем.
      </p>
    </div>
  </div>
</section>
`.trim();

function normalizeHtml(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function serializeCatalogPageSections(sections: CatalogPageSections) {
  const payload: CatalogPagePayloadV1 = {
    version: 1,
    topHtml: normalizeHtml(sections.topHtml),
    bottomHtml: normalizeHtml(sections.bottomHtml),
  };
  return JSON.stringify(payload);
}

export const CATALOG_PAGE_DEFAULT_CONTENT = serializeCatalogPageSections({
  topHtml: CATALOG_PAGE_DEFAULT_TOP_HTML,
  bottomHtml: CATALOG_PAGE_DEFAULT_BOTTOM_HTML,
});

export function parseCatalogPageSections(rawContent?: string | null): CatalogPageSections {
  const raw = typeof rawContent === "string" ? rawContent.trim() : "";
  if (!raw) {
    return {
      topHtml: CATALOG_PAGE_DEFAULT_TOP_HTML,
      bottomHtml: CATALOG_PAGE_DEFAULT_BOTTOM_HTML,
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<CatalogPagePayloadV1>;
    if (parsed && typeof parsed === "object") {
      const hasStructuredFields =
        Object.prototype.hasOwnProperty.call(parsed, "topHtml") ||
        Object.prototype.hasOwnProperty.call(parsed, "bottomHtml");

      if (hasStructuredFields) {
        return {
          topHtml: normalizeHtml(parsed.topHtml),
          bottomHtml: normalizeHtml(parsed.bottomHtml),
        };
      }
    }
  } catch {
                                            
  }

  return {
    topHtml: raw,
    bottomHtml: "",
  };
}
