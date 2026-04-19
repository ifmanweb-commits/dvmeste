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

export function parseCatalogPageSections(rawContent?: string | null): CatalogPageSections {
  const raw = typeof rawContent === "string" ? rawContent.trim() : "";
  if (!raw) {
    return {
      topHtml: "",
      bottomHtml: "",
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
