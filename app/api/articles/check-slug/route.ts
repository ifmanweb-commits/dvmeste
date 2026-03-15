import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/articles/check-slug?slug=...&excludeId=...
 * Проверяет, существует ли статья с указанным slug.
 * Если передан excludeId - исключает статью с этим ID из проверки (для редактирования).
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get("slug");
    const excludeId = searchParams.get("excludeId");

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Slug is required" },
        { status: 400 }
      );
    }

    const existingArticle = await prisma.article.findUnique({
      where: { slug },
      select: { id: true },
    });

    // Если статья найдена и это не та же самая статья (при редактировании)
    const exists = existingArticle && (!excludeId || existingArticle.id !== excludeId);

    return NextResponse.json({
      success: true,
      exists,
      slug,
    });
  } catch (error) {
    console.error("[API] GET /api/articles/check-slug - error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check slug" },
      { status: 500 }
    );
  }
}
