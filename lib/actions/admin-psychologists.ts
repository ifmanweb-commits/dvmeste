"use server";
import { PsychologistStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isDbSyncError } from "@/lib/db-error";
import type { Prisma } from "@prisma/client";
import {
  buildPsychologistPayload,
  cleanupRemovedLocalImages,
  normalizeImageArray,
  removeLocalImages,
} from "@/lib/actions/psychologist-form";

const CURRENT_YEAR = new Date().getFullYear();

                                         
export async function getPsychologistsList() {
  if (!prisma) return [];
  try {
    const list = await prisma.psychologist.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        fullName: true,
        city: true,
        isPublished: true,
        price: true,
      },
    });
    return list;
  } catch (err) {
    if (isDbSyncError(err)) return [];
    throw err;
  }
}

                                                   
export async function getPsychologistById(id: string) {
  if (!prisma) return null;
  try {
    const p = await prisma.psychologist.findUnique({
      where: { id },
    });
    return p;
  } catch (err) {
    if (isDbSyncError(err)) return null;
    throw err;
  }
}

                                                   
export async function getFilteredPsychologists(filters: {
  priceMin?: string;
  priceMax?: string;
  city?: string;
  gender?: string;
  paradigms?: string[];
  levels?: string[];
  ageMin?: string;
  ageMax?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  cursor?: string;
  limit?: number;
  isPublished?: boolean;
}) {
  if (!prisma) return { items: [], nextCursor: null };

  const {
    priceMin,
    priceMax,
    city,
    gender,
    paradigms = [],
    levels = [],
    ageMin,
    ageMax,
    sortBy = "createdAt",
    sortOrder = "desc",
    cursor,
    limit = 20,
    isPublished = true,
  } = filters;

  try {
    const where: Prisma.PsychologistWhereInput = {
      isPublished: isPublished ? true : undefined,
    };

    if (priceMin || priceMax) {
      where.price = {};
      if (priceMin) where.price.gte = parseInt(priceMin, 10);
      if (priceMax) where.price.lte = parseInt(priceMax, 10);
    }

    if (city) {
      where.city = {
        contains: city,
        mode: "insensitive" as const,
      };
    }

    if (gender) {
      where.gender = gender;
    }

    if (paradigms.length > 0) {
      where.mainParadigm = {
        hasSome: paradigms,
      };
    }

    if (levels.length > 0) {
      where.certificationLevel = {
        in: levels.map((l) => parseInt(l, 10)),
      };
    }

    if (ageMin || ageMax) {
      where.birthDate = {};
      if (ageMin) {
        const minBirthYear = CURRENT_YEAR - parseInt(ageMin, 10);
        where.birthDate.lte = new Date(`${minBirthYear}-12-31`);
      }
      if (ageMax) {
        const maxBirthYear = CURRENT_YEAR - parseInt(ageMax, 10);
        where.birthDate.gte = new Date(`${maxBirthYear}-01-01`);
      }
    }

    let orderBy: Prisma.PsychologistOrderByWithRelationInput = {};
    if (sortBy === "age") {
      orderBy = { birthDate: sortOrder === "asc" ? "desc" : "asc" };
    } else if (sortBy === "price" || sortBy === "certificationLevel") {
      orderBy = { [sortBy]: sortOrder };
    } else {
      orderBy = { createdAt: "desc" };
    }

    const cursorCondition = cursor ? { id: cursor } : undefined;

    const items = await prisma.psychologist.findMany({
      where,
      orderBy,
      cursor: cursorCondition,
      skip: cursor ? 1 : 0,
      take: limit + 1,
      select: {
        id: true,
        slug: true,
        fullName: true,
        gender: true,
        birthDate: true,
        city: true,
        price: true,
        shortBio: true,
        images: true,
        mainParadigm: true,
        certificationLevel: true,
        workFormat: true,
      },
    });

    const hasNextPage = items.length > limit;
    const actualItems = hasNextPage ? items.slice(0, -1) : items;
    const nextCursor = hasNextPage ? items[items.length - 2]?.id : null;

    const itemsWithAge = actualItems.map((item) => {
      const age = item.birthDate 
        ? CURRENT_YEAR - item.birthDate.getFullYear()
        : null;
      
      return {
        ...item,
        age,
      };
    });

    return {
      items: itemsWithAge,
      nextCursor,
      totalCount: await prisma.psychologist.count({ where }),
    };
  } catch (err) {
    if (isDbSyncError(err)) return { items: [], nextCursor: null, totalCount: 0 };
    throw err;
  }
}

                                                    
export async function getUniqueCities() {
  if (!prisma) return [];
  try {
    const psychologists = await prisma.psychologist.findMany({
      where: { isPublished: true },
      select: { city: true },
      distinct: ["city"],
    });
    
    return psychologists
      .map(p => p.city)
      .filter((city): city is string => !!city && city.trim() !== "")
      .sort();
  } catch (err) {
    if (isDbSyncError(err)) return [];
    return [];
  }
}

                                      
export async function getFilterStats(filters: {
  priceMin?: string;
  priceMax?: string;
  city?: string;
  gender?: string;
  paradigms?: string[];
  levels?: string[];
  ageMin?: string;
  ageMax?: string;
}) {
  if (!prisma) return null;

  const {
    priceMin,
    priceMax,
    city,
    gender,
    paradigms = [],
    levels = [],
    ageMin,
    ageMax,
  } = filters;

  try {
    const where: Prisma.PsychologistWhereInput = {
      isPublished: true,
    };

    if (priceMin || priceMax) {
      where.price = {};
      if (priceMin) where.price.gte = parseInt(priceMin, 10);
      if (priceMax) where.price.lte = parseInt(priceMax, 10);
    }

    if (city) {
      where.city = {
        contains: city,
        mode: "insensitive",
      };
    }

    if (gender) {
      where.gender = gender;
    }

    if (paradigms.length > 0) {
      where.mainParadigm = {
        hasSome: paradigms,
      };
    }

    if (levels.length > 0) {
      where.certificationLevel = {
        in: levels.map((l) => parseInt(l, 10)),
      };
    }

    if (ageMin || ageMax) {
      where.birthDate = {};
      if (ageMin) {
        const minBirthYear = CURRENT_YEAR - parseInt(ageMin, 10);
        where.birthDate.lte = new Date(`${minBirthYear}-12-31`);
      }
      if (ageMax) {
        const maxBirthYear = CURRENT_YEAR - parseInt(ageMax, 10);
        where.birthDate.gte = new Date(`${maxBirthYear}-01-01`);
      }
    }

    const [minPrice, maxPrice, minAge, maxAge, totalCount] = await Promise.all([
      prisma.psychologist.aggregate({
        where,
        _min: { price: true },
      }),
      prisma.psychologist.aggregate({
        where,
        _max: { price: true },
      }),
      prisma.psychologist.aggregate({
        where,
        _max: { birthDate: true },
      }),
      prisma.psychologist.aggregate({
        where,
        _min: { birthDate: true },
      }),
      prisma.psychologist.count({ where }),
    ]);

    const calculatedMinAge = minAge._max.birthDate 
      ? CURRENT_YEAR - minAge._max.birthDate.getFullYear()
      : null;
    const calculatedMaxAge = maxAge._min.birthDate 
      ? CURRENT_YEAR - maxAge._min.birthDate.getFullYear()
      : null;

    return {
      priceRange: {
        min: minPrice._min.price || 0,
        max: maxPrice._max.price || 0,
      },
      ageRange: {
        min: calculatedMinAge,
        max: calculatedMaxAge,
      },
      total: totalCount,
    };
  } catch (err) {
    if (isDbSyncError(err)) return null;
    console.error("Filter stats error:", err);
    return null;
  }
}

                        
export async function createPsychologist(formData: FormData) {
  if (!prisma) throw new Error("База данных недоступна");

  try {
    const payload = await buildPsychologistPayload(formData);
    await prisma.psychologist.create({ data: payload.data });

  } catch (err: unknown) {
    if (isDbSyncError(err)) {
      redirect("/admin/psychologists?error=db_sync");
    }
    
    const code = err && typeof (err as { code?: string }).code === "string" 
      ? (err as { code: string }).code 
      : "";
    
    if (code === "P2002") {
      redirect("/admin/psychologists/new?error=duplicate_slug");
    }
    
    throw err;
  }

  revalidatePath("/admin/psychologists");
  revalidatePath("/psy-list");
  redirect("/admin/psychologists");


}

                         
export async function updatePsychologist(id: string, formData: FormData) {
  if (!prisma) throw new Error("База данных недоступна");

  try {
    const existing = await prisma.psychologist.findUnique({
      where: { id },
      select: { images: true },
    });
    const payload = await buildPsychologistPayload(formData);

    const certificationLevel = formData.get('certificationLevel');
    const status = formData.get('status') as string;

    // Проверяем, что статус допустимый
    const validStatuses: PsychologistStatus[] = ['PENDING', 'CANDIDATE', 'ACTIVE', 'SUSPENDED', 'REJECTED'];
    const typedStatus = validStatuses.includes(status as PsychologistStatus) 
      ? (status as PsychologistStatus) 
      : undefined;

    await prisma.psychologist.update({
      where: { id },
      data: {
        ...payload.data,
        certificationLevel: certificationLevel 
          ? parseInt(certificationLevel as string) 
          : null,
        ...(typedStatus && { status: typedStatus }), // ← добавляем только если статус валидный
      },
    });

    if (existing?.images) {
      await cleanupRemovedLocalImages(existing.images, normalizeImageArray(payload.data.images));
    }
  } catch (err) {
    if (isDbSyncError(err)) {
      redirect("/admin/psychologists?error=db_sync");
    }
    
    throw err;
  }

  revalidatePath("/admin/psychologists");
  revalidatePath("/psy-list");
  revalidatePath(`/psy-list/${formData.get("slug")}`);
  redirect("/admin/psychologists");
}

                        
export async function deletePsychologist(id: string) {
  if (!prisma) redirect("/admin/psychologists?error=db_unavailable");
  try {
    const psychologist = await prisma.psychologist.findUnique({
      where: { id },
      select: { images: true },
    });
    if (!psychologist) {
      redirect("/admin/psychologists?error=not_found");
    }

    await prisma.psychologist.delete({ where: { id } });
    await removeLocalImages(psychologist.images ?? []);
  } catch (err: unknown) {
    if (isDbSyncError(err)) redirect("/admin/psychologists?error=db_sync");
    redirect("/admin/psychologists?error=delete_failed");
  }
  revalidatePath("/admin/psychologists");
  revalidatePath("/psy-list");
  redirect("/admin/psychologists");
}
