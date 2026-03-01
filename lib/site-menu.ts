import "server-only";

import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { isDbSyncError } from "@/lib/db-error";
import { CATALOG_PAGE_SLUG } from "@/lib/catalog-page-config";
import {
  getPublicPathBySlug,
  normalizeMenuHrefInput,
  type SiteMenuItem,
  type SiteMenuPageOption,
} from "@/lib/site-menu-shared";

export const SITE_MENU_STORAGE_SLUG = "site-header-menu";
export type { SiteMenuItem, SiteMenuPageOption } from "@/lib/site-menu-shared";

const RESERVED_PAGE_SLUGS = new Set(["site-footer", CATALOG_PAGE_SLUG]);

const DEFAULT_SITE_MENU_ITEMS: SiteMenuItem[] = [
  { id: "menu-psy-list", label: "Подобрать психолога", href: "/psy-list" },
  { id: "menu-courses", label: "Курсы", href: "/courses" },
  { id: "menu-lib", label: "Библиотека", href: "/lib" },
  { id: "menu-lib-articles", label: "Статьи", href: "/lib/articles" },
  { id: "menu-connect", label: "Для психологов", href: "/connect" },
  { id: "menu-contacts", label: "Контакты", href: "/contacts" },
];

function normalizeLabel(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, 80) : "";
}

function normalizeMenuItems(value: unknown): SiteMenuItem[] {
  if (!Array.isArray(value)) return [];

  const normalized = value
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as Partial<SiteMenuItem>;
      const label = normalizeLabel(record.label);
      const href = normalizeMenuHrefInput(record.href);
      if (!label || !href) return null;

      const rawId = typeof record.id === "string" ? record.id.trim() : "";
      const id = rawId || `menu-item-${index + 1}`;
      return { id, label, href };
    })
    .filter((item): item is SiteMenuItem => Boolean(item));

  if (normalized.length === 0) return [];

  const seen = new Set<string>();
  return normalized.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function getDefaultSiteMenuItems() {
  return DEFAULT_SITE_MENU_ITEMS.map((item) => ({ ...item }));
}

export function createSiteMenuItemId() {
  return `menu-${randomUUID()}`;
}

export async function getSiteMenuPageOptions(): Promise<SiteMenuPageOption[]> {
  const fallback = [
    { slug: "home", title: "Главная", href: "/" },
    { slug: "psy-list", title: "Подобрать психолога", href: "/psy-list" },
    { slug: "courses", title: "Курсы", href: "/courses" },
    { slug: "lib", title: "Библиотека", href: "/lib" },
    { slug: "connect", title: "Для психологов", href: "/connect" },
    { slug: "contacts", title: "Контакты", href: "/contacts" },
  ] satisfies SiteMenuPageOption[];

  if (!prisma) return fallback;

  try {
    const rows = await prisma.page.findMany({
      where: {
        slug: { notIn: [...RESERVED_PAGE_SLUGS] },
      },
      orderBy: [{ isPublished: "desc" }, { updatedAt: "desc" }],
      select: {
        slug: true,
        title: true,
      },
    });

    const merged = new Map<string, SiteMenuPageOption>();
    for (const item of fallback) {
      merged.set(item.slug, item);
    }

    for (const row of rows) {
      if (!row.slug) continue;
      merged.set(row.slug, {
        slug: row.slug,
        title: row.title || row.slug,
        href: getPublicPathBySlug(row.slug),
      });
    }

    return [...merged.values()];
  } catch (err) {
    if (isDbSyncError(err)) return fallback;
    throw err;
  }
}

export async function getSiteMenuItems(): Promise<SiteMenuItem[]> {
  const fallback = getDefaultSiteMenuItems();
  if (!prisma) return fallback;

  try {
    const row = await prisma.dataList.findUnique({
      where: { slug: SITE_MENU_STORAGE_SLUG },
      select: { items: true },
    });

    if (!row) return fallback;
    if (!Array.isArray(row.items)) return fallback;
    return normalizeMenuItems(row.items);
  } catch (err) {
    if (isDbSyncError(err)) return fallback;
    throw err;
  }
}

export async function saveSiteMenuItems(items: SiteMenuItem[]) {
  if (!prisma) return;

  const normalized = normalizeMenuItems(items);

  await prisma.dataList.upsert({
    where: { slug: SITE_MENU_STORAGE_SLUG },
    create: {
      slug: SITE_MENU_STORAGE_SLUG,
      name: "Site Header Menu",
      items: normalized,
    },
    update: {
      name: "Site Header Menu",
      items: normalized,
    },
  });
}
