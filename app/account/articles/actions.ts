"use server";

import { updateArticle } from "@/lib/articles"; // Проверь правильность пути к твоему articles.ts
import { revalidatePath } from "next/cache";

export async function saveArticleAction(id: string, data: {
  title: string;
  content: string;
  tags: string[];
  excerpt?: string;
  isPublished?: boolean;
}) {
  try {
    // Вызываем твой существующий метод из articles.ts
    // Он уже содержит валидацию тегов, проверку прав и очистку кэша
    await updateArticle(id, {
      title: data.title,
      content: data.content,
      tags: data.tags,
      shortText: data.excerpt || "", // Твой метод ожидает shortText
      isPublished: data.isPublished ?? false,
    });

    // Обновляем кэш страниц, чтобы изменения сразу были видны в списке
    revalidatePath("/account/articles");
    revalidatePath(`/account/articles/${id}`);

    return { success: true };
  } catch (error: any) {
    console.error("Failed to save article:", error);
    return { success: false, error: error.message || "Ошибка при сохранении" };
  }
}