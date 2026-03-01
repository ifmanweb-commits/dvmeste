"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { DB_SYNC_MESSAGE, isDbSyncError } from "@/lib/db-error";
import { normalizeMenuHrefInput, type SiteMenuItem } from "@/lib/site-menu-shared";
import {
  createSiteMenuItemId,
  saveSiteMenuItems,
} from "@/lib/site-menu";

export type SiteMenuScope = "admin" | "manager";

type DraftSiteMenuItem = {
  id?: string;
  label?: string;
  href?: string;
};

type SaveResult = { success: true; items: SiteMenuItem[] } | { success: false; error: string };

function normalizeDraftItems(items: DraftSiteMenuItem[]): SiteMenuItem[] {
  const normalized: SiteMenuItem[] = [];

  for (const entry of items) {
    const rawLabel = typeof entry.label === "string" ? entry.label.trim().replace(/\s+/g, " ") : "";
    const label = rawLabel.slice(0, 80);
    const href = normalizeMenuHrefInput(entry.href);
    if (!label || !href) continue;

    const id =
      typeof entry.id === "string" && entry.id.trim().length > 0 ? entry.id.trim() : createSiteMenuItemId();
    normalized.push({ id, label, href });
  }

  const seen = new Set<string>();
  return normalized.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function revalidateMenuTargets(scope: SiteMenuScope) {
  const pagesPath = scope === "manager" ? "/managers/pages" : "/admin/pages";
  const menuPath = scope === "manager" ? "/managers/pages/menu" : "/admin/pages/menu";

  revalidatePath(pagesPath);
  revalidatePath(menuPath);
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/psy-list");
  revalidatePath("/courses");
  revalidatePath("/lib");
  revalidatePath("/lib/articles");
  revalidatePath("/connect");
  revalidatePath("/contacts");
  revalidatePath("/complaint");
}

export async function saveSiteMenu(scope: SiteMenuScope, items: DraftSiteMenuItem[]): Promise<SaveResult> {
  try {
    if (!prisma) {
      return { success: false, error: "База данных недоступна." };
    }

    if (!Array.isArray(items)) {
      return { success: false, error: "Некорректный формат данных меню." };
    }

    const normalized = normalizeDraftItems(items);
    if (normalized.length === 0) {
      return { success: false, error: "Добавьте хотя бы один пункт меню с названием и адресом." };
    }

    await saveSiteMenuItems(normalized);
    revalidateMenuTargets(scope);
    return { success: true, items: normalized };
  } catch (err) {
    if (isDbSyncError(err)) {
      return { success: false, error: DB_SYNC_MESSAGE };
    }
    console.error("site-menu.save failed", { scope, err });
    return { success: false, error: "Не удалось сохранить меню." };
  }
}
