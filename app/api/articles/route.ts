import { NextResponse } from "next/server";
import { getArticles } from "@/lib/articles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const articles = await getArticles({});
    return NextResponse.json(
      { success: true, articles: articles || [] },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("[API] GET /api/articles - error:", error);
    return NextResponse.json(
      {
        success: false,
        articles: [],
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log("[API] POST /api/articles - data:", JSON.stringify(data, null, 2));
    
    const { createArticle } = await import("@/lib/articles");
    const article = await createArticle(data);
    
    return NextResponse.json({ success: true, article });
  } catch (error: unknown) {
    console.error("[API] POST /api/articles - error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create article" },
      { status: 400 }
    );
  }
}
