// lib/actions/article-delete.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { unlink } from "fs/promises";
import path from "path";

export async function deleteArticleAction(articleId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Не авторизован");

    // Проверяем, что статья принадлежит пользователю
    const article = await prisma.article.findFirst({
      where: { 
        id: articleId,
        userId: user.id
      },
      include: {
        articleImages: true
      }
    });

    if (!article) throw new Error("Статья не найдена");

    // Удаляем файлы изображений с диска
    for (const image of article.articleImages) {
      try {
        await unlink(image.storagePath);
      } catch (err) {
        console.warn("Failed to delete image file:", err);
      }
    }

    // Удаляем статью (изображения удалятся каскадно из БД)
    await prisma.article.delete({
      where: { id: articleId }
    });

    // Удаляем папку статьи (опционально)
    try {
      const articleDir = path.join(process.cwd(), "public", "files", "articles", articleId);
      await unlink(articleDir);
    } catch (err) {
      // Папка может быть не пустой или уже удалена
    }

    revalidatePath("/account/articles");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete article:", error);
    return { success: false, error: error.message };
  }
}