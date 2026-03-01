const LOCAL_ASSET_PREFIXES = ["/uploads/", "/api/uploads/", "/pages/files/", "/articles/files/"] as const;

function normalizeLocalAssetPath(rawPath: string): string | null {
  const value = rawPath.trim();
  if (!value) return null;

  const pathWithSlash = value.startsWith("/") ? value : `/${value}`;

  if (pathWithSlash.startsWith("/api/uploads/")) {
    return pathWithSlash.replace(/^\/api\/uploads\//, "/uploads/");
  }

  if (LOCAL_ASSET_PREFIXES.some((prefix) => pathWithSlash.startsWith(prefix))) {
    return pathWithSlash;
  }

  return null;
}

function normalizeAbsoluteAssetUrl(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    const path = normalizeLocalAssetPath(parsed.pathname);
    if (!path) return null;
    return `${path}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

export function normalizeEmbeddedLocalAssetUrls(html: string): string {
  if (!html || !html.trim()) return html || "";

  return html.replace(
    /(src|href)\s*=\s*(["'])(https?:\/\/[^"']+)\2/gi,
    (fullMatch, attrName, quote, rawUrl) => {
      const normalized = normalizeAbsoluteAssetUrl(String(rawUrl));
      if (!normalized) return fullMatch;
      return `${String(attrName)}=${String(quote)}${normalized}${String(quote)}`;
    }
  );
}
