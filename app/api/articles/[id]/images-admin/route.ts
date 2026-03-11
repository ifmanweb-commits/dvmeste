import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { unlink } from "fs/promises";
import path from "path";

// GET /api/articles/[id]/images-admin - получить все файлы статьи (из БД + из ФС)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const user = await getCurrentUser();
    if (!user?.isAdmin && !user?.isManager) {
      return NextResponse.json({ success: false, error: "Доступ запрещён" }, { status: 403 });
    }

    // Проверяем существование статьи
    const article = await prisma.article.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!article) {
      return NextResponse.json({ success: false, error: "Статья не найдена" }, { status: 404 });
    }

    // 1. Получаем изображения из БД
    const dbImages = await prisma.articleImage.findMany({
      where: { articleId: id },
      orderBy: { createdAt: 'desc' }
    });

    // 2. Сканируем папку на диске
    const fs = require('fs').promises;
    const articleDir = path.join(process.cwd(), "public", "files", "articles", id);
    
    let diskFiles: { name: string; url: string; size: number; }[] = [];
    
    try {
      const files = await fs.readdir(articleDir);
      
      for (const file of files) {
        // Пропускаем, если это папка
        const stat = await fs.stat(path.join(articleDir, file));
        if (!stat.isFile()) continue;
        
        // Проверяем, есть ли этот файл уже в БД
        const existsInDb = dbImages.some(img => 
          img.url === `/files/articles/${id}/${file}`
        );
        
        // Если нет в БД — добавляем как обычный файл
        if (!existsInDb) {
          diskFiles.push({
            name: file,
            url: `/files/articles/${id}/${file}`,
            size: stat.size
          });
        }
      }
    } catch (err) {
      // Папки может не быть — это нормально
      console.log("No files directory or error reading:", err);
    }

    // 3. Объединяем: сначала из БД, потом из ФС
    const allFiles = [
      ...dbImages.map(img => ({
        id: img.id,
        name: img.url.split('/').pop() || 'image',
        url: img.url,
        size: 0, // размер не храним в БД
        isImage: true,
        fromDb: true
      })),
      ...diskFiles.map(file => ({
        name: file.name,
        url: file.url,
        size: file.size,
        isImage: file.name.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i) ? true : false,
        fromDb: false
      }))
    ];

    return NextResponse.json({ 
      success: true, 
      files: allFiles
    });
  } catch (error) {
    console.error("Failed to get article files:", error);
    return NextResponse.json({ success: false, error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}

// POST /api/articles/[id]/images-admin - загрузить новое изображение
// POST /api/articles/[id]/images-admin - загрузить файл (изображение или документ)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const user = await getCurrentUser();
    if (!user?.isAdmin && !user?.isManager) {
      return NextResponse.json({ success: false, error: "Доступ запрещён" }, { status: 403 });
    }

    // Проверяем существование статьи
    const article = await prisma.article.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!article) {
      return NextResponse.json({ success: false, error: "Статья не найдена" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "Файл не передан" }, { status: 400 });
    }

    // Проверяем размер (5MB для всех файлов)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "Размер файла не должен превышать 5 МБ" }, { status: 400 });
    }

    // Транслитерация имени файла
    function transliterate(text: string): string {
      const map: Record<string, string> = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
        'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
        'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
        'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
        'я': 'ya', 'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
        'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N',
        'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H',
        'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E',
        'Ю': 'Yu', 'Я': 'Ya'
      };
      
      return text.replace(/[а-яА-ЯёЁ]/g, (char) => map[char] || char)
                 .replace(/[^a-zA-Z0-9.-]/g, '-')
                 .replace(/-+/g, '-')
                 .replace(/^-|-$/g, '');
    }

    function sanitizeFilename(filename: string): string {
      const ext = path.extname(filename);
      const base = path.basename(filename, ext);
      const transliterated = transliterate(base);
      const timestamp = Date.now();
      return `${transliterated}-${timestamp}${ext.toLowerCase()}`;
    }

    // Создаём папку, если её нет
    const fs = require('fs').promises;
    const articleDir = path.join(process.cwd(), "public", "files", "articles", id);
    await fs.mkdir(articleDir, { recursive: true });

    // Сохраняем файл
    const safeFilename = sanitizeFilename(file.name);
    const filePath = path.join(articleDir, safeFilename);
    const publicUrl = `/files/articles/${id}/${safeFilename}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(filePath, buffer);

    // Если это изображение — создаём запись в БД
    let imageRecord = null;
    if (file.type.startsWith("image/")) {
      imageRecord = await prisma.articleImage.create({
        data: {
          articleId: id,
          url: publicUrl,
          storagePath: filePath
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      file: {
        id: imageRecord?.id || null,
        url: publicUrl,
        name: safeFilename,
        isImage: file.type.startsWith("image/")
      }
    });
  } catch (error) {
    console.error("Failed to upload file:", error);
    return NextResponse.json({ success: false, error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}

// DELETE /api/articles/[id]/images-admin?imageId=xxx
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const user = await getCurrentUser();
    if (!user?.isAdmin && !user?.isManager) {
      return NextResponse.json({ success: false, error: "Доступ запрещён" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const imageId = searchParams.get("imageId");
    const filename = searchParams.get("filename");

    if (!imageId && !filename) {
      return NextResponse.json({ success: false, error: "Не указан ID изображения или имя файла" }, { status: 400 });
    }

    let filePath: string | null = null;

    // Если есть imageId — ищем в БД (это изображение)
    if (imageId) {
      const image = await prisma.articleImage.findFirst({
        where: { 
          id: imageId,
          articleId: id
        }
      });

      if (!image) {
        return NextResponse.json({ success: false, error: "Изображение не найдено" }, { status: 404 });
      }

      filePath = image.storagePath;

      // Удаляем запись из БД
      await prisma.articleImage.delete({
        where: { id: imageId }
      });
    } 
    // Если нет imageId, но есть filename — это обычный файл
    else if (filename) {
      filePath = path.join(process.cwd(), "public", "files", "articles", id, filename);
    }

    // Удаляем файл с диска
    if (filePath) {
      try {
        const fs = require('fs').promises;
        await fs.unlink(filePath);
      } catch (err) {
        console.warn("File already deleted or not found:", err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete file:", error);
    return NextResponse.json({ success: false, error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}