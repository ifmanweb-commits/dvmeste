"use server";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function saveSecretCatalogSettings(
  optIn: boolean,
  freeSessions: number,
  price: number
) {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Не авторизован" };
  }

  const userId = session.user.id;

  // Проверяем, есть ли у пользователя доступ included к секретному каталогу
  const catalogAccess = await prisma.userAccess.findFirst({
    where: {
      userId,
      resourceType: "catalog",
      resourceId: "secret-catalog"
    }
  });

  const accessAny = catalogAccess as any;
  const permission = accessAny?.metaData?.permission;

  if (permission !== "included") {
    return { success: false, error: "Нет доступа для изменения настроек" };
  }

  // Получаем текущий metaData пользователя
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    return { success: false, error: "Пользователь не найден" };
  }

  const userAny = user as any;
  const currentMetaData = userAny.metaData || {};

  // Обновляем только secretCatalog, сохраняя остальные данные
  const newMetaData = {
    ...currentMetaData,
    secretCatalog: optIn
      ? {
          optIn: true,
          freeSessions: Math.max(0, Math.floor(freeSessions)),
          price: Math.max(0, Math.floor(price))
        }
      : {
          optIn: false
        }
  };

  // Обновляем пользователя (используем каст для работы с metaData)
  await prisma.user.update({
    where: { id: userId },
    data: {
      metaData: newMetaData
    }
  } as any);

  return { success: true };
}

export async function getSecretCatalogSettings() {
  const session = await getSession();
  if (!session?.user) {
    return null;
  }

  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    return null;
  }

  const userAny = user as any;
  const metaData = userAny.metaData || {};
  const secretCatalog = metaData.secretCatalog || { optIn: false, freeSessions: 1, price: 0 };

  return {
    optIn: secretCatalog.optIn || false,
    freeSessions: secretCatalog.freeSessions || 1,
    price: secretCatalog.price || 0
  };
}