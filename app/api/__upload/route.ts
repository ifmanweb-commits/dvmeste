export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { randomBytes } from "crypto";

const BASE_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const PUBLIC_URL_PREFIX = "/uploads";
const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

function isSafeFilename(filename: string): boolean {
  const unsafePatterns = [/\.\./, /\//, /\\/, /^\./, /[\x00-\x1f\x7f<>:"|?*]/];
  return !unsafePatterns.some((pattern) => pattern.test(filename));
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const scope = formData.get("scope") as string;      // 'pages' или 'articles'
    const entityKey = formData.get("entityKey") as string; // ID страницы или temp-123

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Нет файла" }, { status: 400 });
    }

    if (!scope || !entityKey) {
      return NextResponse.json({ error: "Не указаны scope или entityKey" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `Файл слишком большой (максимум ${MAX_SIZE / 1024 / 1024} МБ)` },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Разрешены только изображения (JPEG, PNG, WebP, GIF)" },
        { status: 400 }
      );
    }

    // Создаём папку для конкретной сущности
    const uploadDir = path.join(BASE_UPLOAD_DIR, scope, entityKey);
    await mkdir(uploadDir, { recursive: true });

    const originalExt = path.extname(file.name).toLowerCase();
    const extension = ALLOWED_EXTENSIONS.includes(originalExt) ? originalExt : ".jpg";
    const uniqueName = randomBytes(16).toString("hex") + extension;

    if (!isSafeFilename(uniqueName)) {
      return NextResponse.json({ error: "Недопустимое имя файла" }, { status: 400 });
    }

    const filePath = path.join(uploadDir, uniqueName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Формируем правильный URL с учётом scope и entityKey
    const url = `${PUBLIC_URL_PREFIX}/${scope}/${entityKey}/${uniqueName}`;

    console.log(`📁 Файл сохранен: ${filePath}`);
    console.log(`🔗 Доступен по URL: ${url}`);
    console.log(`📊 Размер: ${file.size} байт, Тип: ${file.type}`);

    return NextResponse.json({
      success: true,
      url,
      filename: uniqueName,
      size: file.size,
      type: file.type,
    });
  } catch (err) {
    console.error("❌ Upload error:", err);
    return NextResponse.json(
      {
        error: "Ошибка загрузки файла",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");
    const scope = searchParams.get("scope");
    const entityKey = searchParams.get("entityKey");

    if (!filename || !scope || !entityKey) {
      return NextResponse.json({ error: "Не все параметры указаны" }, { status: 400 });
    }

    if (!isSafeFilename(filename)) {
      return NextResponse.json({ error: "Недопустимое имя файла" }, { status: 400 });
    }

    const filePath = path.join(BASE_UPLOAD_DIR, scope, entityKey, filename);

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
    }

    await unlink(filePath);
    console.log(`🗑️ Файл удален: ${filePath}`);

    return NextResponse.json({
      success: true,
      message: "Файл успешно удален",
    });
  } catch (err) {
    console.error("❌ Delete error:", err);
    return NextResponse.json(
      {
        error: "Ошибка удаления файла",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");
    const entityKey = searchParams.get("entityKey");

    if (!scope || !entityKey) {
      return NextResponse.json({ error: "Не указаны scope или entityKey" }, { status: 400 });
    }

    const fs = await import("fs/promises");
    const uploadDir = path.join(BASE_UPLOAD_DIR, scope, entityKey);
    
    try {
      await fs.access(uploadDir);
    } catch {
      // Папки нет - возвращаем пустой список
      return NextResponse.json({
        success: true,
        files: [],
        count: 0,
      });
    }

    const files = await fs.readdir(uploadDir);

    const fileStats = await Promise.all(
      files.map(async (filename) => {
        if (!isSafeFilename(filename)) return null;

        try {
          const filePath = path.join(uploadDir, filename);
          const stat = await fs.stat(filePath);
          if (!stat.isFile()) return null;

          const ext = path.extname(filename).toLowerCase();
          if (!ALLOWED_EXTENSIONS.includes(ext)) return null;

          return {
            filename,
            url: `${PUBLIC_URL_PREFIX}/${scope}/${entityKey}/${filename}`,
            size: stat.size,
            createdAt: stat.birthtime,
            modifiedAt: stat.mtime,
          };
        } catch {
          return null;
        }
      })
    );

    const validFiles = fileStats.filter(Boolean);

    return NextResponse.json({
      success: true,
      files: validFiles,
      count: validFiles.length,
    });
  } catch (err) {
    console.error("❌ List files error:", err);
    return NextResponse.json({ error: "Ошибка получения списка файлов" }, { status: 500 });
  }
}