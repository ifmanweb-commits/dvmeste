"use server";

import { prisma } from "@/lib/prisma";
import { CATALOG_PAGE_SIZE, CATALOG_PAGE_SIZE_MAX } from "@/lib/config";
import type {
  CatalogFilters,
  CatalogPagination,
  CatalogResult,
  PsychologistCatalogItem,
} from "@/types/catalog";

function computeAge(birthDate: Date | null): number | null {
  if (!birthDate) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

export async function getPsychologists(
  filters: CatalogFilters = {},
  pagination: CatalogPagination & { page?: number } = { limit: CATALOG_PAGE_SIZE },
  excludeUserId?: string // Исключить текущего пользователя из списка
): Promise<CatalogResult> {
  if (!prisma) return { items: [], page: 1, limit: CATALOG_PAGE_SIZE, total: 0, totalPages: 0 };

  const {
    priceMin,
    priceMax,
    ageMin,
    ageMax,
    paradigms,
    certificationLevels,
    city,
    gender,
    sortBy = "activity",
    sortOrder = "desc",
  } = filters;

  const { limit, page: currentPage = 1 } = pagination;
  const take = Math.min(Math.max(limit, 1), CATALOG_PAGE_SIZE_MAX);
  const skip = (currentPage - 1) * take;

  // 1. Базовые фильтры по пользователям
  const where: any = {
    isPublished: true,
    status: "ACTIVE",
  };

  if (priceMin != null || priceMax != null) {
    where.price = {};
    if (priceMin != null) where.price.gte = priceMin;
    if (priceMax != null) where.price.lte = priceMax;
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

  // 2. Сортировка
  // По умолчанию (activity) или явно указано - сортируем по totalBonus DESC, затем sortOrder ASC
  let orderBy: any;
  if (sortBy === "activity" || !sortBy) {
    // Сортировка по активности: сначала по баллам (убывание), затем случайно
    orderBy = [
      { totalBonus: 'desc' },
      { sortOrder: 'asc' },
    ];
  } else if (sortBy === "price") {
    orderBy = { price: sortOrder };
  } else if (sortBy === "certificationLevel") {
    orderBy = { certificationLevel: sortOrder };
  } else if (sortBy === "createdAt") {
    orderBy = { createdAt: sortOrder };
  } else {
    // Fallback - случайный порядок
    orderBy = { sortOrder: "asc" };
  }

  // Исключаем текущего пользователя, если передан
  if (excludeUserId) {
    where.id = { not: excludeUserId };
  }

  // 3. Получаем общее количество пользователей (для пагинации)
  const total = await prisma.user.count({ where });

  // 4. Получаем пользователей с offset-based пагинацией
  const users = await prisma.user.findMany({
    where,
    select: {
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
      freeSession: true,
      avatarUrl: true,
      createdAt: true,
    },
    orderBy,
    take,
    skip,
  });

  if (users.length === 0) {
    return { items: [], page: currentPage, limit: take, total, totalPages: Math.ceil(total / take) };
  }

  // 5. Фильтрация по возрасту (если нужна)
  let filteredUsers = users;
  if (ageMin != null || ageMax != null) {
    filteredUsers = users.filter((user) => {
      const age = computeAge(user.birthDate);
      if (age === null) return false;
      if (ageMin != null && age < ageMin) return false;
      if (ageMax != null && age > ageMax) return false;
      return true;
    });
  }

  if (filteredUsers.length === 0) {
    return { items: [], page: currentPage, limit: take, total, totalPages: Math.ceil(total / take) };
  }

  // 6. Получаем проверенные фото для всех пользователей
  const userIds = filteredUsers.map(u => u.id);
  
  // Если после фильтрации по возрасту никого не осталось
  if (userIds.length === 0) {
    return { items: [], page: currentPage, limit: take, total, totalPages: Math.ceil(total / take) };
  }
  const photos = await prisma.document.findMany({
    where: {
      userId: { in: userIds },
      type: "PHOTO",
      verifiedAt: { not: null }, // Только проверенные фото
    },
    select: {
      userId: true,
      url: true,
    },
    orderBy: {
      uploadedAt: "asc",
    },
  });

  // Группируем фото по userId
  const photosByUser = photos.reduce((acc, photo) => {
    if (!acc[photo.userId]) acc[photo.userId] = [];
    acc[photo.userId].push(photo.url);
    return acc;
  }, {} as Record<string, string[]>);

  // 7. Получаем статистику проверенного образования
  const educationStats = await prisma.document.groupBy({
    by: ['userId', 'type'],
    where: {
      userId: { in: userIds },
      type: { in: ["ACADEMIC_EDUCATION", "PROFESSIONAL_TRAINING", "COURSE"] },
      verifiedAt: { not: null }, // Только проверенные документы
    },
    _count: true,
  });

  // Считаем дипломы и курсы по каждому пользователю
  const statsByUser = educationStats.reduce((acc, stat) => {
    if (!acc[stat.userId]) {
      acc[stat.userId] = { diplomas: 0, courses: 0 };
    }
    if (stat.type === "ACADEMIC_EDUCATION") {
      acc[stat.userId].diplomas += stat._count;
    } else {
      acc[stat.userId].courses += stat._count;
    }
    return acc;
  }, {} as Record<string, { diplomas: number; courses: number }>);

  // 8. Формируем результат
  const items: PsychologistCatalogItem[] = filteredUsers.map((user) => {
    // Получаем проверенные фото пользователя
    const userPhotos = photosByUser[user.id] || [];
    
    // Проверяем, есть ли avatarUrl среди проверенных фото
    const hasVerifiedAvatar = user.avatarUrl && userPhotos.includes(user.avatarUrl);
    
    // Для превью используем:
    // 1. Аватар, если он прошёл модерацию
    // 2. Иначе первое проверенное фото
    // 3. Иначе null (будет заглушка)
    const previewImage = hasVerifiedAvatar 
      ? user.avatarUrl 
      : (userPhotos[0] ?? null);
    
    return {
      id: user.id,
      slug: user.slug || '',
      fullName: user.fullName || 'Без имени',
      gender: user.gender || '',
      birthDate: user.birthDate,
      city: user.city || '',
      workFormat: user.workFormat || "",
      mainParadigm: user.mainParadigm || [],
      certificationLevel: user.certificationLevel,
      shortBio: user.shortBio || "",
      price: user.price,
      freeSession: user.freeSession ?? 0,
      images: previewImage ? [previewImage] : [], // Для каталога только одно фото (превью)
      educationCount: statsByUser[user.id]?.diplomas || 0,
      coursesCount: statsByUser[user.id]?.courses || 0,
    };
  });

  const totalPages = Math.ceil(total / take);
  
  return {
    items,
    page: currentPage,
    limit: take,
    total,
    totalPages,
  };
}
