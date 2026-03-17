"use server";

import { prisma } from "@/lib/prisma";
import { CATALOG_PAGE_SIZE, CATALOG_PAGE_SIZE_MAX } from "@/constants/catalog";
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
  const orderBy: Record<string, string> = {};
  if (sortBy === "price") {
    orderBy.price = sortOrder;
  } else if (sortBy === "certificationLevel") {
    orderBy.certificationLevel = sortOrder;
  } else if (sortBy === "age") {
    // Сортировка по возрасту будет позже, после фильтрации
    orderBy.birthDate = sortOrder === "asc" ? "desc" : "asc"; // моложе = больше дата
  } else {
    orderBy.createdAt = "desc";
  }

  // 3. Получаем пользователей
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
    take: take + 1,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
  });

  if (users.length === 0) {
    return { items: [], nextCursor: null, hasMore: false };
  }

  // 4. Определяем следующий курсор
  let nextCursor: string | null = null;
  let resultUsers = users;
  if (users.length > take) {
    const last = users.pop();
    if (last) nextCursor = last.id;
    resultUsers = users;
  }

  // 5. Фильтрация по возрасту (если нужна)
  let filteredUsers = resultUsers;
  if (ageMin != null || ageMax != null) {
    filteredUsers = resultUsers.filter((user) => {
      const age = computeAge(user.birthDate);
      if (age === null) return false;
      if (ageMin != null && age < ageMin) return false;
      if (ageMax != null && age > ageMax) return false;
      return true;
    });

    // Если после фильтрации осталось меньше элементов, сбрасываем курсор
    if (filteredUsers.length < take) {
      nextCursor = null;
    }
  }

  if (filteredUsers.length === 0) {
    return { items: [], nextCursor: null, hasMore: false };
  }

  // 6. Получаем проверенные фото для всех пользователей
  const userIds = filteredUsers.map(u => u.id);
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

  return {
    items,
    nextCursor,
    hasMore: nextCursor != null,
  };
}