import fs from "node:fs";
import path from "node:path";
import { FOOTER_DEFAULT_CONTENT } from "@/lib/footer-config";
import { CATALOG_PAGE_DEFAULT_CONTENT, CATALOG_PAGE_SLUG } from "@/lib/catalog-page-config";
import { CONNECT_PAGE_SLUG, HOME_PAGE_SLUG } from "@/lib/system-pages";

function readDefaultHtml(filename: string) {
  try {
    return fs.readFileSync(path.join(process.cwd(), "lib", "system-page-defaults", filename), "utf8").trim();
  } catch {
    return "";
  }
}

const HOME_DEFAULT_CONTENT = readDefaultHtml("home.html");
const CONNECT_DEFAULT_CONTENT = readDefaultHtml("connect.html");

export function getSystemPageDefaultContentBySlug(slug: string) {
  if (slug === HOME_PAGE_SLUG) return HOME_DEFAULT_CONTENT;
  if (slug === CONNECT_PAGE_SLUG) return CONNECT_DEFAULT_CONTENT;
  if (slug === CATALOG_PAGE_SLUG) return CATALOG_PAGE_DEFAULT_CONTENT;
  return FOOTER_DEFAULT_CONTENT;
}
