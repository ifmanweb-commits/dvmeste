// lib/actions/article-create.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createDraftArticle() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Не авторизован");

  // Проверяем количество черновиков
  const draftCount = await prisma.article.count({
    where: {
      userId: user.id,
      moderationStatus: "DRAFT"
    }
  });

  if (draftCount >= 2) {
    throw new Error("Лимит черновиков исчерпан (максимум 2)");
  }

  // Создаём статью
  const article = await prisma.article.create({
    data: {
      title: "",
      content: "",
      slug: `draft-${Date.now()}`, // временный slug, потом обновится
      tags: [],
      userId: user.id,
      moderationStatus: "DRAFT"
    }
  });

  revalidatePath("/account/articles");
  
  // Перенаправляем на страницу редактирования
  redirect(`/account/articles/${article.id}`);
}