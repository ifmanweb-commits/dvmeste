import { CATALOG_PAGE_SIZE, CATALOG_PAGE_SIZE_MAX } from "@/constants/catalog";
import type { CatalogFilters, CatalogPagination } from "@/types/catalog";

function parseNum(value: string | string[] | undefined): number | undefined {
    if (value == null) return undefined;
    const s = typeof value === "string" ? value : value[0];
    if (s == null || s === "") return undefined;
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
}

function parseStr(value: string | string[] | undefined): string | undefined {
    if (value == null) return undefined;
    const s = typeof value === "string" ? value : value[0];
    return s?.trim() || undefined;
}

function parseArray(value: string | string[] | undefined): string[] {
    if (value == null) return [];
    const arr = Array.isArray(value) ? value : [value];
    return arr.filter((s): s is string => typeof s === "string" && s.length > 0);
}

export function searchParamsToFilters(
    params: Record<string, string | string[] | undefined>
): CatalogFilters {
    const paradigms = parseArray(params.paradigms);
    const certificationLevels = parseArray(params.levels)
        .map(Number)
        .filter((n) => n >= 1 && n <= 3) as (1 | 2 | 3)[];

    const sortBy = parseStr(params.sortBy);
    const sortOrder = parseStr(params.sortOrder);
    return {
        priceMin: parseNum(params.priceMin),
        priceMax: parseNum(params.priceMax),
        ageMin: parseNum(params.ageMin),
        ageMax: parseNum(params.ageMax),
        paradigms: paradigms.length > 0 ? paradigms : undefined,
        certificationLevels:
            certificationLevels.length > 0 ? certificationLevels : undefined,
        city: parseStr(params.city),
        gender: parseStr(params.gender),
        sortBy:
            sortBy === "price" || sortBy === "certificationLevel" ? sortBy : undefined,
        sortOrder:
            sortOrder === "asc" || sortOrder === "desc" ? sortOrder : undefined,
    };
}

export function searchParamsToPagination(
    params: Record<string, string | string[] | undefined>
): CatalogPagination {
    const limit = parseNum(params.limit) ?? CATALOG_PAGE_SIZE;
    const cursor = parseStr(params.cursor);
    return { limit: Math.min(Math.max(limit, 1), CATALOG_PAGE_SIZE_MAX), cursor };
}
