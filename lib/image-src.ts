   
                                                                            
                                                                      
                                                                              
   
const LOCAL_IMAGE_PATH_PREFIXES = ["/uploads/", "/api/uploads/", "/pages/files/", "/articles/files/"] as const;

function normalizeLocalImagePath(rawPath: string): string | null {
  const value = rawPath.trim();
  if (!value) return null;

  const pathWithSlash = value.startsWith("/") ? value : `/${value}`;

  if (pathWithSlash.startsWith("/api/uploads/")) {
    return pathWithSlash.replace(/^\/api\/uploads\//, "/uploads/");
  }

  if (LOCAL_IMAGE_PATH_PREFIXES.some((prefix) => pathWithSlash.startsWith(prefix))) {
    return pathWithSlash;
  }

  return null;
}

function normalizeAbsoluteLocalImageUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;

    const normalizedPath = normalizeLocalImagePath(parsed.pathname);
    if (!normalizedPath) return null;

    return `${normalizedPath}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

export function normalizeImageSrc(src: string): string {
  if (!src || !src.trim()) return "";
  const s = src.trim();

  if (s.startsWith("http://") || s.startsWith("https://")) {
    const localFromAbsolute = normalizeAbsoluteLocalImageUrl(s);
    return localFromAbsolute || s;
  }

  const normalizedLocal = normalizeLocalImagePath(s);
  if (normalizedLocal) {
    return normalizedLocal;
  }

  return s.startsWith("/") ? s : "/" + s;
}

export function isExternalImageSrc(src: string): boolean {
  if (!src || !src.trim()) return false;
  const s = src.trim();
  if (!s.startsWith("http://") && !s.startsWith("https://")) return false;
  return normalizeAbsoluteLocalImageUrl(s) === null;
}
