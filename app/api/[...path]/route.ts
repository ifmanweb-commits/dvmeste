import { NextRequest, NextResponse } from "next/server";
import { readFile, unlink, stat } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

function isSafeFilename(filename: string): boolean {
  return !filename.includes('..') && !filename.includes('/') && !filename.includes('\\');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    const filename = pathSegments.join('/');
    
    if (!isSafeFilename(filename)) {
      return NextResponse.json({ error: "Недопустимое имя файла" }, { status: 400 });
    }

    const filePath = path.join(UPLOAD_DIR, filename);
    
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
    }
    
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      return NextResponse.json({ error: "Это не файл" }, { status: 400 });
    }
    
    const ext = path.extname(filename).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    const fileBuffer = await readFile(filePath);
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
    
  } catch (err) {
    console.error("❌ File serve error:", err);
    return NextResponse.json({ error: "Ошибка при чтении файла" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    const filename = pathSegments.join('/');
    
    if (!isSafeFilename(filename)) {
      return NextResponse.json({ error: "Недопустимое имя файла" }, { status: 400 });
    }

    const filePath = path.join(UPLOAD_DIR, filename);
    
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
    }
    
    await unlink(filePath);
    
    return NextResponse.json({ success: true, message: "Файл удален" });
    
  } catch (err) {
    console.error("❌ File delete error:", err);
    return NextResponse.json({ error: "Ошибка удаления файла" }, { status: 500 });
  }
}