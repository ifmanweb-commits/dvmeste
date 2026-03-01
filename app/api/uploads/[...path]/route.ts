import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { readFile, stat } from "fs/promises";

const PUBLIC_UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
};

function safeRelativePath(pathSegments: string[]): string | null {
  if (!Array.isArray(pathSegments) || pathSegments.length === 0) return null;

  const cleaned: string[] = [];

  for (const segment of pathSegments) {
    if (!segment || segment === "." || segment === "..") return null;
    if (segment.includes("/") || segment.includes("\\")) return null;
    cleaned.push(segment);
  }

  return cleaned.join(path.sep);
}

function isInsideDir(baseDir: string, targetPath: string): boolean {
  const base = path.resolve(baseDir);
  const target = path.resolve(targetPath);
  return target === base || target.startsWith(`${base}${path.sep}`);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    const relative = safeRelativePath(pathSegments);

    if (!relative) {
      return NextResponse.json({ error: "Недопустимый путь" }, { status: 400 });
    }

    const filePath = path.join(PUBLIC_UPLOADS_DIR, relative);

    if (!isInsideDir(PUBLIC_UPLOADS_DIR, filePath)) {
      return NextResponse.json({ error: "Недопустимый путь" }, { status: 400 });
    }

    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const buffer = await readFile(filePath);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
  }
}
