import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getCurrentUser } from "@/lib/auth/session";

// Проверка: является ли ID draft-ключом (временным ключом)
function isDraftKey(id: string): boolean {
  return id.startsWith("page-draft-") || id.startsWith("temp-");
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

// GET /api/admin/pages/[id]/files - получить все файлы страницы
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

    const pageDir = path.join(process.cwd(), "public", "files", "pages", id);
    
    let diskFiles: { name: string; url: string; size: number; }[] = [];
    
    try {
      const files = await fs.readdir(pageDir);
      
      for (const file of files) {
        const stat = await fs.stat(path.join(pageDir, file));
        if (!stat.isFile()) continue;
        
        diskFiles.push({
          name: file,
          url: `/files/pages/${id}/${file}`,
          size: stat.size
        });
      }
    } catch (err) {
      console.log("No files directory or error reading:", err);
    }

    const allFiles = diskFiles.map(file => ({
      name: file.name,
      url: file.url,
      size: file.size,
      isImage: file.name.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i) ? true : false,
      fromDb: false
    }));

    return NextResponse.json({ 
      success: true, 
      files: allFiles
    });
  } catch (error) {
    console.error("Failed to get page files:", error);
    return NextResponse.json({ success: false, error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}

// POST /api/admin/pages/[id]/files - загрузить файл
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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "Файл не передан" }, { status: 400 });
    }

    // Проверяем размер (5MB для всех файлов)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "Размер файла не должен превышать 5 МБ" }, { status: 400 });
    }

    // Создаём папку, если её нет
    const pageDir = path.join(process.cwd(), "public", "files", "pages", id);
    await fs.mkdir(pageDir, { recursive: true });

    // Сохраняем файл
    const safeFilename = sanitizeFilename(file.name);
    const filePath = path.join(pageDir, safeFilename);
    const publicUrl = `/files/pages/${id}/${safeFilename}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(filePath, buffer);

    return NextResponse.json({ 
      success: true, 
      file: {
        id: null,
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

// DELETE /api/admin/pages/[id]/files?filename=xxx
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
    const filename = searchParams.get("filename");

    if (!filename) {
      return NextResponse.json({ success: false, error: "Не указано имя файла" }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), "public", "files", "pages", id, filename);
    
    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.warn("File already deleted or not found:", err);
      return NextResponse.json({ success: false, error: "Файл не найден" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete file:", error);
    return NextResponse.json({ success: false, error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}