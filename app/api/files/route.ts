import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

type FileScope = "articles" | "pages";

type ManagedFile = {
  name: string;
  url: string;
  size: number;
  updatedAt: string;
};

const MAX_FILE_SIZE = 50 * 1024 * 1024;        
const PUBLIC_ROOT = path.join(process.cwd(), "public");
const SCOPE_ROOTS: Record<FileScope, string> = {
  articles: path.join(PUBLIC_ROOT, "articles", "files"),
  pages: path.join(PUBLIC_ROOT, "pages", "files"),
};
const BLOCKED_EXTENSIONS = new Set([
  "exe",
  "bat",
  "cmd",
  "com",
  "ps1",
  "sh",
  "bash",
  "zsh",
  "js",
  "mjs",
  "cjs",
  "ts",
  "tsx",
  "jsx",
  "php",
  "py",
  "rb",
  "pl",
  "jar",
  "html",
  "htm",
  "svg",
]);

const CYRILLIC_MAP: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "c",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

function toLatin(input: string): string {
  return input
    .split("")
    .map((char) => {
      const lower = char.toLowerCase();
      const mapped = CYRILLIC_MAP[lower];
      if (!mapped) return char;
      return char === lower ? mapped : mapped.toUpperCase();
    })
    .join("");
}

function normalizeToken(input: string, fallback = "file"): string {
  const transliterated = toLatin(input)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");

  const cleaned = transliterated
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "")
    .toLowerCase();

  return cleaned || fallback;
}

function parseScope(value: string | null): FileScope | null {
  if (value === "articles" || value === "pages") return value;
  return null;
}

function sanitizeEntityKey(input: string | null): string | null {
  if (!input) return null;
  const key = normalizeToken(input, "entity").slice(0, 96);
  if (!key) return null;
  return key;
}

function sanitizeFileName(input: string, fallbackExt = ""): string {
  const baseName = path.basename(input || "file");
  const parsed = path.parse(baseName);
  const rawBase = parsed.name || "file";
  const rawExt = (parsed.ext || fallbackExt || "").replace(/^\./, "");

  const base = normalizeToken(rawBase, "file").slice(0, 120);
  const ext = normalizeToken(rawExt, "").replace(/[^a-z0-9]/g, "").slice(0, 10);

  return ext ? `${base}.${ext}` : base;
}

function extensionFromMime(type: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
    "application/pdf": "pdf",
    "application/zip": "zip",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "text/plain": "txt",
  };
  return map[type] || "";
}

function isBlockedExtension(fileName: string): boolean {
  const ext = path.extname(fileName).replace(/^\./, "").toLowerCase();
  if (!ext) return false;
  return BLOCKED_EXTENSIONS.has(ext);
}

function buildPublicUrl(scope: FileScope, entityKey: string, fileName: string): string {
  return `/${scope}/files/${entityKey}/${fileName}`;
}

function ensureInside(parent: string, target: string): boolean {
  const parentResolved = path.resolve(parent);
  const targetResolved = path.resolve(target);
  return targetResolved === parentResolved || targetResolved.startsWith(`${parentResolved}${path.sep}`);
}

function getEntityDir(scope: FileScope, entityKey: string): string {
  return path.join(SCOPE_ROOTS[scope], entityKey);
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function getUniqueFileName(dir: string, desiredName: string): Promise<string> {
  const parsed = path.parse(desiredName);
  let candidate = desiredName;
  let index = 2;

  while (await exists(path.join(dir, candidate))) {
    candidate = `${parsed.name}-${index}${parsed.ext}`;
    index += 1;
  }

  return candidate;
}

async function toManagedFile(scope: FileScope, entityKey: string, fileName: string): Promise<ManagedFile | null> {
  const filePath = path.join(getEntityDir(scope, entityKey), fileName);
  if (!ensureInside(getEntityDir(scope, entityKey), filePath)) return null;

  try {
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) return null;
    return {
      name: fileName,
      url: buildPublicUrl(scope, entityKey, fileName),
      size: stats.size,
      updatedAt: stats.mtime.toISOString(),
    };
  } catch {
    return null;
  }
}

async function listEntityFiles(scope: FileScope, entityKey: string): Promise<ManagedFile[]> {
  const dir = getEntityDir(scope, entityKey);

  let entries: string[] = [];
  try {
    entries = await fs.readdir(dir);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code === "ENOENT") return [];
    throw error;
  }

  const files = (
    await Promise.all(
      entries.map(async (entry) => {
        const safeName = sanitizeFileName(entry);
        if (safeName !== entry) return null;
        return toManagedFile(scope, entityKey, entry);
      })
    )
  ).filter((file): file is ManagedFile => file !== null);

  files.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return files;
}

function normalizeScopeAndKey(search: URLSearchParams): { scope: FileScope; entityKey: string } | null {
  const scope = parseScope(search.get("scope"));
  const entityKey = sanitizeEntityKey(search.get("entityKey"));
  if (!scope || !entityKey) return null;
  return { scope, entityKey };
}

async function cleanupEmptyFolders(startDir: string, stopDir: string): Promise<void> {
  let current = path.resolve(startDir);
  const stop = path.resolve(stopDir);

  while (current.startsWith(stop) && current !== stop) {
    try {
      const entries = await fs.readdir(current);
      if (entries.length > 0) break;
      await fs.rmdir(current);
      current = path.dirname(current);
    } catch {
      break;
    }
  }
}

function extractPathname(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      return parsed.pathname || null;
    } catch {
      return null;
    }
  }

  if (!trimmed.startsWith("/")) return null;
  return trimmed;
}

async function deleteByPublicUrl(rawUrl: string): Promise<boolean> {
  const pathname = extractPathname(rawUrl);
  if (!pathname) return false;

  if (!pathname.startsWith("/pages/") && !pathname.startsWith("/articles/")) {
    return false;
  }

  const relative = pathname.replace(/^\/+/, "");
  const absolute = path.resolve(PUBLIC_ROOT, relative);
  if (!ensureInside(PUBLIC_ROOT, absolute)) return false;

  try {
    const stats = await fs.stat(absolute);
    if (!stats.isFile()) return false;
    await fs.unlink(absolute);
    const dir = path.dirname(absolute);
    await cleanupEmptyFolders(dir, PUBLIC_ROOT);
    return true;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code === "ENOENT") return true;
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const normalized = normalizeScopeAndKey(request.nextUrl.searchParams);
    if (!normalized) {
      return NextResponse.json({ success: false, error: "Некорректные scope/entityKey" }, { status: 400 });
    }

    const files = await listEntityFiles(normalized.scope, normalized.entityKey);
    return NextResponse.json({ success: true, files });
  } catch (error) {
    console.error("[api/files][GET] error:", error);
    return NextResponse.json({ success: false, error: "Не удалось получить список файлов" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const scope = parseScope(formData.get("scope")?.toString() ?? null);
    const entityKey = sanitizeEntityKey(formData.get("entityKey")?.toString() ?? null);
    const file = formData.get("file");

    if (!scope || !entityKey) {
      return NextResponse.json({ success: false, error: "Некорректные scope/entityKey" }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "Файл не передан" }, { status: 400 });
    }

    if (file.size <= 0) {
      return NextResponse.json({ success: false, error: "Файл пустой" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `Файл слишком большой. Максимум ${Math.floor(MAX_FILE_SIZE / 1024 / 1024)}MB` },
        { status: 400 }
      );
    }

    const dir = getEntityDir(scope, entityKey);
    await fs.mkdir(dir, { recursive: true });

    const fallbackExt = extensionFromMime(file.type);
    const desiredName = sanitizeFileName(file.name, fallbackExt);
    if (isBlockedExtension(desiredName)) {
      return NextResponse.json({ success: false, error: "Тип файла запрещен для загрузки" }, { status: 400 });
    }

    const uniqueName = await getUniqueFileName(dir, desiredName);
    const filePath = path.join(dir, uniqueName);
    if (!ensureInside(dir, filePath)) {
      return NextResponse.json({ success: false, error: "Некорректный путь файла" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(bytes));

    const uploaded = await toManagedFile(scope, entityKey, uniqueName);
    if (!uploaded) {
      return NextResponse.json({ success: false, error: "Файл загружен, но не удалось прочитать метаданные" }, { status: 500 });
    }

    return NextResponse.json({ success: true, file: uploaded });
  } catch (error) {
    console.error("[api/files][POST] error:", error);
    return NextResponse.json({ success: false, error: "Не удалось загрузить файл" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const byUrl = request.nextUrl.searchParams.get("url");
    if (byUrl) {
      const deleted = await deleteByPublicUrl(byUrl);
      if (!deleted) {
        return NextResponse.json({ success: false, error: "Некорректный URL файла" }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    const normalized = normalizeScopeAndKey(request.nextUrl.searchParams);
    if (!normalized) {
      return NextResponse.json({ success: false, error: "Некорректные scope/entityKey" }, { status: 400 });
    }

    const rawName = request.nextUrl.searchParams.get("name");
    if (!rawName) {
      return NextResponse.json({ success: false, error: "Не указано имя файла" }, { status: 400 });
    }

    const fileName = path.basename(rawName);
    if (fileName !== rawName) {
      return NextResponse.json({ success: false, error: "Некорректное имя файла" }, { status: 400 });
    }

    const safeName = sanitizeFileName(fileName);
    if (safeName !== fileName) {
      return NextResponse.json({ success: false, error: "Имя файла содержит недопустимые символы" }, { status: 400 });
    }

    const dir = getEntityDir(normalized.scope, normalized.entityKey);
    const filePath = path.join(dir, fileName);
    if (!ensureInside(dir, filePath)) {
      return NextResponse.json({ success: false, error: "Некорректный путь файла" }, { status: 400 });
    }

    try {
      await fs.unlink(filePath);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException)?.code;
      if (code === "ENOENT") {
        return NextResponse.json({ success: false, error: "Файл не найден" }, { status: 404 });
      }
      throw error;
    }

    await cleanupEmptyFolders(path.dirname(filePath), SCOPE_ROOTS[normalized.scope]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/files][DELETE] error:", error);
    return NextResponse.json({ success: false, error: "Не удалось удалить файл" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      scope?: string;
      entityKey?: string;
      name?: string;
      newName?: string;
    };

    const scope = parseScope(body.scope ?? null);
    const entityKey = sanitizeEntityKey(body.entityKey ?? null);
    const currentName = body.name ? path.basename(body.name) : "";
    const requestedName = (body.newName || "").trim();

    if (!scope || !entityKey || !currentName || !requestedName) {
      return NextResponse.json({ success: false, error: "Некорректные данные для переименования" }, { status: 400 });
    }

    const dir = getEntityDir(scope, entityKey);
    const oldPath = path.join(dir, currentName);
    if (!ensureInside(dir, oldPath)) {
      return NextResponse.json({ success: false, error: "Некорректный путь файла" }, { status: 400 });
    }

    const oldExt = path.extname(currentName).replace(/^\./, "");
    const hasExtension = Boolean(path.extname(requestedName));
    const desiredName = sanitizeFileName(requestedName, hasExtension ? "" : oldExt);
    if (isBlockedExtension(desiredName)) {
      return NextResponse.json({ success: false, error: "Тип файла запрещен" }, { status: 400 });
    }

    let finalName = desiredName;
    if (finalName !== currentName) {
      finalName = await getUniqueFileName(dir, finalName);
    }

    const newPath = path.join(dir, finalName);
    if (!ensureInside(dir, newPath)) {
      return NextResponse.json({ success: false, error: "Некорректный путь файла" }, { status: 400 });
    }

    if (finalName !== currentName) {
      await fs.rename(oldPath, newPath);
    } else if (!(await exists(oldPath))) {
      return NextResponse.json({ success: false, error: "Файл не найден" }, { status: 404 });
    }

    const file = await toManagedFile(scope, entityKey, finalName);
    if (!file) {
      return NextResponse.json({ success: false, error: "Не удалось прочитать файл после переименования" }, { status: 500 });
    }

    return NextResponse.json({ success: true, file });
  } catch (error) {
    console.error("[api/files][PATCH] error:", error);
    return NextResponse.json({ success: false, error: "Не удалось переименовать файл" }, { status: 500 });
  }
}
