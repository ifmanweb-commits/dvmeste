import { mkdir, unlink, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { randomBytes } from "crypto";
import type { Prisma } from "@prisma/client";

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

type JsonValue = Prisma.InputJsonValue;
type OrderedImageInput =
  | { type: "file"; fileIndex: number }
  | { type: "url"; url: string };

function toText(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function toRawText(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

function normalizeSlug(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "");
}

export function slugFromName(name: string): string {
  const translit: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
    и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
    с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
    ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };

  let out = "";
  for (const c of name.toLowerCase().trim()) {
    if (translit[c]) out += translit[c];
    else if (/[a-z0-9]/.test(c)) out += c;
    else if (/\s/.test(c) && out && !out.endsWith("-")) out += "-";
  }
  return out.replace(/-+/g, "-").replace(/^-|-$/g, "") || "psychologist";
}

function isJsonValue(value: unknown): value is JsonValue {
  if (value === null) return true;
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean") return true;
  if (Array.isArray(value)) return value.every((item) => isJsonValue(item));
  if (t === "object") {
    return Object.values(value as Record<string, unknown>).every((item) => isJsonValue(item));
  }
  return false;
}

export function parseEducation(value: string): JsonValue {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return isJsonValue(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function parseLocalImageUrls(value: string): string[] {
  return parseImageUrls(value).filter((item) => item.startsWith("/uploads/"));
}

function isAllowedImageUrl(value: string): boolean {
  return value.startsWith("/uploads/") || /^https?:\/\//i.test(value);
}

function parseImageUrls(value: string): string[] {
  if (!value) return [];
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => isAllowedImageUrl(item));
}

function parseOrderedImages(value: string): OrderedImageInput[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    const items: OrderedImageInput[] = [];
    for (const raw of parsed) {
      if (!raw || typeof raw !== "object") continue;
      const item = raw as Record<string, unknown>;

      if (
        item.type === "file" &&
        typeof item.fileIndex === "number" &&
        Number.isInteger(item.fileIndex) &&
        item.fileIndex >= 0
      ) {
        items.push({ type: "file", fileIndex: item.fileIndex });
        continue;
      }

      if (item.type === "url" && typeof item.url === "string") {
        const url = item.url.trim();
        if (isAllowedImageUrl(url)) {
          items.push({ type: "url", url });
        }
      }
    }

    return items;
  } catch {
    return [];
  }
}

async function saveUploadedFile(file: File): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`Недопустимый тип файла: ${file.type}`);
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    throw new Error(`Файл слишком большой: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }

  const ext = path.extname(file.name).toLowerCase();
  const safeExt = ALLOWED_IMAGE_EXTENSIONS.includes(ext) ? ext : ".jpg";
  const safeName = `${Date.now()}_${randomBytes(8).toString("hex")}${safeExt}`;
  const filePath = path.join(UPLOAD_DIR, safeName);

  await mkdir(UPLOAD_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return `/uploads/${safeName}`;
}

export async function saveNewImages(formData: FormData): Promise<string[]> {
  const files = formData.getAll("images");
  const uploaded: string[] = [];

  for (const item of files) {
    if (!(item instanceof File)) continue;
    if (!item.name || item.size <= 0) continue;
    const path = await saveUploadedFile(item);
    uploaded.push(path);
  }

  return uploaded;
}

export async function removeLocalImages(images: string[]): Promise<void> {
  for (const imgPath of images) {
    if (!imgPath.startsWith("/uploads/")) continue;
    const absPath = path.join(process.cwd(), "public", imgPath.replace(/^\/uploads\//, "uploads/"));
    try {
      if (existsSync(absPath)) {
        await unlink(absPath);
      }
    } catch {
    }
  }
}

export async function cleanupRemovedLocalImages(previous: string[], next: string[]): Promise<void> {
  const removed = previous.filter((img) => img.startsWith("/uploads/") && !next.includes(img));
  await removeLocalImages(removed);
}

export function normalizeImageArray(
  value:
    | string[]
    | Prisma.PsychologistCreateimagesInput
    | Prisma.PsychologistUpdateimagesInput
    | undefined
): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if ("set" in value && Array.isArray(value.set)) return value.set;
  return [];
}

export async function buildPsychologistPayload(
  formData: FormData
): Promise<{ slug: string; data: Prisma.PsychologistUncheckedCreateInput }> {
  const fullName = toText(formData.get("fullName"));
  if (!fullName) throw new Error("Укажите ФИО");

  const rawSlug = normalizeSlug(toText(formData.get("slug")));
  const slug = rawSlug || slugFromName(fullName);

  const uploadedImages = await saveNewImages(formData);
  const orderedImages = parseOrderedImages(toText(formData.get("orderedImages")));
  const fallbackImageUrls = parseImageUrls(toText(formData.get("imageUrls")));

  const images = orderedImages.length > 0
    ? orderedImages
        .map((item) => {
          if (item.type === "file") return uploadedImages[item.fileIndex] ?? null;
          return item.url;
        })
        .filter((item): item is string => Boolean(item))
    : [...uploadedImages, ...fallbackImageUrls];

  const birthDateStr = toText(formData.get("birthDate"));
  const firstDiplomaStr = toText(formData.get("firstDiplomaDate"));
  const lastCertStr = toText(formData.get("lastCertificationDate"));

  const certificationLevel = Math.min(
    3,
    Math.max(1, parseInt(toText(formData.get("certificationLevel")) || "1", 10))
  );
  const price = Math.max(0, parseInt(toText(formData.get("price")) || "0", 10));

  const mainParadigm = formData
    .getAll("mainParadigm")
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);

  const publishedValues = formData.getAll("isPublished");
  const isPublished = publishedValues[publishedValues.length - 1] === "on";

  return {
    slug,
    data: {
      fullName,
      slug,
      gender: toText(formData.get("gender")) || "Не указан",
      birthDate: birthDateStr ? new Date(birthDateStr) : new Date("1990-01-01"),
      city: toText(formData.get("city")),
      workFormat: toText(formData.get("workFormat")) || "Онлайн и оффлайн",
      firstDiplomaDate: firstDiplomaStr ? new Date(firstDiplomaStr) : null,
      lastCertificationDate: lastCertStr ? new Date(lastCertStr) : null,
      mainParadigm,
      certificationLevel,
      shortBio: toText(formData.get("shortBio")).slice(0, 400),
      longBio: toText(formData.get("longBio")),
      price,
      contactInfo: toRawText(formData.get("contactInfo")),
      isPublished,
      images,
      education: parseEducation(toText(formData.get("education"))),
    },
  };
}
