export type SiteMenuItem = {
  id: string;
  label: string;
  href: string;
};

export type SiteMenuPageOption = {
  slug: string;
  title: string;
  href: string;
};

export function getPublicPathBySlug(slug: string) {
  if (!slug) return "/";
  if (slug === "home") return "/";
  if (["psy-list", "courses", "lib", "connect", "contacts", "complaint"].includes(slug)) {
    return `/${slug}`;
  }
  return `/s/${slug}`;
}

function isExternalHref(value: string) {
  return /^(https?:\/\/|mailto:|tel:)/i.test(value);
}

export function normalizeMenuHrefInput(value: unknown) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "";

  if (isExternalHref(raw)) return raw;
  if (raw.startsWith("/")) return raw;

  const maybeDomain = raw.toLowerCase();
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(maybeDomain)) {
    return `https://${raw}`;
  }

  const slug = raw
    .toLowerCase()
    .replace(/^\/+/, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
  if (!slug) return "";

  return getPublicPathBySlug(slug);
}
