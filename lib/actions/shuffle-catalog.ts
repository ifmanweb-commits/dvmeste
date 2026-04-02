"use server";

import { prisma } from "@/lib/prisma";

export async function shuffleCatalog() {
  // Получаем всех активных психологов
  const psychologists = await prisma.user.findMany({
    where: { isPublished: true, status: "ACTIVE" },
    select: { id: true }
  });
  
  if (psychologists.length === 0) {
    console.log("[shuffleCatalog] Нет активных психологов для перемешивания");
    return;
  }
  
  // Перемешиваем массив ID (Fisher-Yates shuffle)
  const shuffledIds = psychologists.map(p => p.id);
  for (let i = shuffledIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledIds[i], shuffledIds[j]] = [shuffledIds[j], shuffledIds[i]];
  }
  
  // Формируем массивы для unnest (одинарные кавычки для строк!)
  const idArray = shuffledIds.map(id => `'${id}'`).join(',');
  const orderArray = shuffledIds.map((_, index) => index + 1).join(',');
  
  // Пакетное обновление через unnest (PostgreSQL)
  await prisma.$executeRawUnsafe(`
    UPDATE "User"
    SET "sortOrder" = orders.sort_order
    FROM (
      SELECT unnest(ARRAY[${idArray}]) AS id,
             unnest(ARRAY[${orderArray}]) AS sort_order
    ) AS orders
    WHERE "User".id = orders.id
  `);
  
  console.log(`[shuffleCatalog] ✅ Порядок каталога обновлён для ${psychologists.length} психологов`);
}
