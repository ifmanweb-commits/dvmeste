"use server";

import { updateArticle } from "@/lib/articles";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";

export async function saveArticleAction(id: string, data: {
  title: string;
  content: string;
  tags: string[];
  excerpt?: string;
  isPublished?: boolean;
  moderationStatus?: string;      // ← добавить
  submittedAt?: Date | null;      // ← добавить
}) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Необходимо авторизоваться" };
  }

  // Проверка: только ACTIVE пользователи могут управлять статьями
  if (user.status === "CANDIDATE") {
    return { success: false, error: "Только проверенные психологи могут управлять статьями" };
  }

  try {
    await updateArticle(id, {
      title: data.title,
      content: data.content,
      tags: data.tags,
      shortText: data.excerpt || "",
      isPublished: data.isPublished ?? false,
      moderationStatus: data.moderationStatus, // ← передаём
      submittedAt: data.submittedAt,           // ← передаём
    });

    revalidatePath("/account/articles");
    revalidatePath(`/account/articles/${id}`);

    return { success: true };
  } catch (error: any) {
    console.error("Failed to save article:", error);
    return { success: false, error: error.message || "Ошибка при сохранении" };
  }
}