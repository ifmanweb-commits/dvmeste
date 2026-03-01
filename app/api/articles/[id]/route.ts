import { NextRequest, NextResponse } from "next/server";
import { getArticleById, updateArticle, deleteArticle } from "@/lib/articles";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log("[API] GET /api/articles/[id] - id:", id);
    
    const article = await getArticleById(id);
    
    if (!article) {
      return NextResponse.json(
        { success: false, error: "Article not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, article });
  } catch (error) {
    console.error("[API] Error fetching article:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch article" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    console.log("[API] PUT /api/articles/[id] - id:", id, "data:", data);
    
    const article = await updateArticle(id, data);
    
    return NextResponse.json({ success: true, article });
  } catch (error: unknown) {
    console.error("[API] Error updating article:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update article" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log("[API] DELETE /api/articles/[id] - id:", id);
    
    await deleteArticle(id);
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[API] Error deleting article:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete article" },
      { status: 400 }
    );
  }
}
