"use server";

import { prisma } from "@/lib/db";
import { isDbSyncError } from "@/lib/db-error";
import type { Prisma } from "@prisma/client";

export async function getCandidatesList(params: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  if (!prisma) return { items: [], total: 0, pages: 0, currentPage: 1 };

  // Устанавливаем значения по умолчанию
  const page = params.page ?? 1; // если undefined, то 1
  const limit = params.limit ?? 20;
  const search = params.search ?? "";
  
  const skip = (page - 1) * limit;

  try {
    // Формируем условие поиска
    const where: Prisma.PsychologistWhereInput = {
      status: "CANDIDATE",
    };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { contactInfo: { contains: search, mode: "insensitive" } },
      ];
    }

    // Получаем кандидатов с пагинацией
    const [items, total] = await Promise.all([
      prisma.psychologist.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          price: true,
          contactInfo: true,
          createdAt: true,
          status: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.psychologist.count({ where }),
    ]);

    return {
      items,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    };
  } catch (err) {
    if (isDbSyncError(err)) {
      return { items: [], total: 0, pages: 0, currentPage: 1 };
    }
    throw err;
  }
}