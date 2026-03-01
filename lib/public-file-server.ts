import path from "path";
import { readFile, stat } from "fs/promises";
import { NextResponse } from "next/server";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".zip": "application/zip",
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

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

export async function servePublicFile(baseDir: string, pathSegments: string[]) {
  try {
    const relative = safeRelativePath(pathSegments);
    if (!relative) {
      return NextResponse.json({ error: "Недопустимый путь" }, { status: 400 });
    }

    const filePath = path.join(baseDir, relative);
    if (!isInsideDir(baseDir, filePath)) {
      return NextResponse.json({ error: "Недопустимый путь" }, { status: 400 });
    }

    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
    }

    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": getContentType(filePath),
        "Content-Length": String(fileStat.size),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
  }
}

export async function servePublicFileHead(baseDir: string, pathSegments: string[]) {
  try {
    const relative = safeRelativePath(pathSegments);
    if (!relative) {
      return new NextResponse(null, { status: 400 });
    }

    const filePath = path.join(baseDir, relative);
    if (!isInsideDir(baseDir, filePath)) {
      return new NextResponse(null, { status: 400 });
    }

    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(null, {
      headers: {
        "Content-Type": getContentType(filePath),
        "Content-Length": String(fileStat.size),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
