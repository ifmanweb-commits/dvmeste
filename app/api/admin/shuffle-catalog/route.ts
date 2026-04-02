import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { shuffleCatalog } from "@/lib/actions/shuffle-catalog";

export async function POST() {
  const user = await getCurrentUser();
  
  if (!user || !user.isAdmin) {
    return NextResponse.json(
      { error: "Требуется авторизация администратора" },
      { status: 403 }
    );
  }
  
  try {
    await shuffleCatalog();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[shuffle-catalog-api] Ошибка:", error);
    return NextResponse.json(
      { error: "Ошибка при обновлении порядка" },
      { status: 500 }
    );
  }
}