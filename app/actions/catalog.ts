"use server";

import { prisma } from "@/lib/prisma";
import { CATALOG_PAGE_SIZE, CATALOG_PAGE_SIZE_MAX } from "@/constants/catalog";
import type {
  CatalogFilters,
  CatalogPagination,
  CatalogResult,
  PsychologistCatalogItem,
} from "@/types/catalog";

function computeAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

type EducationEntry = { isDiploma?: boolean };

function countEducation(education: unknown): { diplomas: number; courses: number } {
  if (!Array.isArray(education)) return { diplomas: 0, courses: 0 };
  let diplomas = 0;
  let courses = 0;
  for (const e of education as EducationEntry[]) {
    if (e?.isDiploma) diplomas++;
    else courses++;
  }
  return { diplomas, courses };
}

export async function getPsychologists(
  filters: CatalogFilters = {},
  pagination: CatalogPagination = { limit: CATALOG_PAGE_SIZE }
): Promise<CatalogResult> {
  if (!prisma) return { items: [], nextCursor: null, hasMore: false };

  const {
    priceMin,
    priceMax,
    ageMin,
    ageMax,
    paradigms,
    certificationLevels,
    city,
    gender,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = filters;
  const { limit, cursor } = pagination;
  const take = Math.min(Math.max(limit, 1), CATALOG_PAGE_SIZE_MAX);

  // ✅ Добавляем фильтр по статусу — только активные
  const where: Record<string, unknown> = { 
    isPublished: true,
    status: "ACTIVE" 
  };
  
  if (priceMin != null || priceMax != null) {
    where.price = {};
    if (priceMin != null) (where.price as Record<string, number>).gte = priceMin;
    if (priceMax != null) (where.price as Record<string, number>).lte = priceMax;
  }
  if (certificationLevels?.length) {
    where.certificationLevel = { in: certificationLevels };
  }
  if (city?.trim()) {
    where.city = { equals: city.trim(), mode: "insensitive" };
  }
  if (gender?.trim()) {
    where.gender = { equals: gender.trim(), mode: "insensitive" };
  }
  if (paradigms?.length) {
    where.mainParadigm = { hasSome: paradigms };
  }

  const orderBy =
    sortBy === "price"
      ? ({ price: sortOrder } as const)
      : sortBy === "certificationLevel"
        ? ({ certificationLevel: sortOrder } as const)
        : ({ createdAt: "desc" } as const);

  const select = {
    id: true,
    slug: true,
    fullName: true,
    gender: true,
    birthDate: true,
    city: true,
    workFormat: true,
    mainParadigm: true,
    certificationLevel: true,
    shortBio: true,
    price: true,
    images: true,
    education: true,
  };

  let rows: Array<Record<string, unknown>>;
  try {
    rows = await prisma.psychologist.findMany({
      ...(where ? { where } : {}),
      select,
      ...(orderBy ? { orderBy } : {}),
      take: take + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg.includes("DATABASE_URL") ||
      msg.includes("PrismaClientInitializationError") ||
      msg.includes("does not exist") ||
      msg.includes("Unknown column")
    ) {
      return { items: [], nextCursor: null, hasMore: false };
    }
    throw err;
  }

  let items = rows as unknown as (PsychologistCatalogItem & { education: unknown })[];
  let nextCursor: string | null = null;
  if (items.length > take) {
    const last = items.pop();
    if (last) nextCursor = last.id;
  }

  if (ageMin != null || ageMax != null) {
    items = items.filter((p) => {
      const age = computeAge(p.birthDate);
      if (ageMin != null && age < ageMin) return false;
      if (ageMax != null && age > ageMax) return false;
      return true;
    });
    if (nextCursor != null && items.length < take) nextCursor = null;
  }

  const resultItems: PsychologistCatalogItem[] = items.map((p) => {
    const { diplomas, courses } = countEducation(p.education);
    return {
      id: p.id,
      slug: p.slug,
      fullName: p.fullName,
      gender: p.gender,
      birthDate: p.birthDate,
      city: p.city,
      workFormat: p.workFormat ?? "",
      mainParadigm: p.mainParadigm ?? [],
      certificationLevel: p.certificationLevel,
      shortBio: p.shortBio,
      price: p.price,
      images: p.images ?? [],
      educationCount: diplomas,
      coursesCount: courses,
    };
  });

  return {
    items: resultItems,
    nextCursor,
    hasMore: nextCursor != null,
  };
}