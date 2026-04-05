import { NextResponse } from "next/server";
import { recalculateArticleBonus } from "@/lib/cron/recalculate-article-bonus";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST() {
  try {
    // Проверяем, что пользователь - админ или модератор
    const user = await getCurrentUser();
    if (!user?.isAdmin && !user?.isManager) {
      return NextResponse.json(
        { error: "Доступ запрещён" },
        { status: 403 }
      );
    }

    // Запускаем пересчёт баллов
    const updatedUsersCount = await recalculateArticleBonus();

    return NextResponse.json({
      success: true,
      message: `Пересчёт завершён. Обновлено пользователей: ${updatedUsersCount}`,
    });
  } catch (error: any) {
    console.error("Ошибка при ручном пересчёте баллов:", error);
    return NextResponse.json(
      { error: error.message || "Ошибка при пересчёте баллов" },
      { status: 500 }
    );
  }
}