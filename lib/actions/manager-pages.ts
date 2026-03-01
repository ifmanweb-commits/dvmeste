"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/db";
import { isDbSyncError } from "@/lib/db-error";
import { getSystemPageBySlug, isSystemPageSlug, SYSTEM_PAGE_CONFIG, SYSTEM_PAGE_SLUGS } from "@/lib/system-pages";
import { getSystemPageDefaultContentBySlug } from "@/lib/system-page-default-content";
import { CATALOG_PAGE_SLUG, serializeCatalogPageSections } from "@/lib/catalog-page-config";

function isNextRedirectError(err: unknown): err is { digest: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    typeof (err as { digest?: unknown }).digest === "string" &&
    (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

type SystemPageRecord = {
  id: string;
  slug: string;
  title: string;
  template: string;
  content: string;
  showHeader: boolean;
  showFooter: boolean;
  isPublished: boolean;
  updatedAt: Date;
};

                                                          
export async function getPagesList() {
  if (!prisma) return [];
  try {
    const list = await prisma.page.findMany({
      where: {
        slug: { notIn: [...SYSTEM_PAGE_SLUGS] },
      },
      orderBy: { updatedAt: "desc" },
      select: { id: true, slug: true, title: true, template: true, isPublished: true },
    });
    return list;
  } catch (err) {
    if (isDbSyncError(err)) return [];
    throw err;
  }
}

async function getOrCreateSystemPage(systemSlug: string): Promise<SystemPageRecord | null> {
  const systemPage = getSystemPageBySlug(systemSlug);
  if (!prisma || !systemPage) return null;

  try {
    const found = await prisma.page.findUnique({
      where: { slug: systemPage.slug },
      select: {
        id: true,
        slug: true,
        title: true,
        template: true,
        content: true,
        showHeader: true,
        showFooter: true,
        isPublished: true,
        updatedAt: true,
      },
    });

    if (found) {
      const hasContent = Boolean(found.content?.trim());
      const needsDefaultContent = !hasContent;
      const needsNormalization =
        found.title !== systemPage.title ||
        found.template !== "empty" ||
        !found.isPublished ||
        needsDefaultContent;

      if (!needsNormalization) return found;

      const normalized = await prisma.page.update({
        where: { id: found.id },
        data: {
          title: systemPage.title,
          template: "empty",
          isPublished: true,
          content: hasContent ? found.content : getSystemPageDefaultContentBySlug(systemPage.slug),
        },
        select: {
          id: true,
          slug: true,
          title: true,
          template: true,
          content: true,
          showHeader: true,
          showFooter: true,
          isPublished: true,
          updatedAt: true,
        },
      });

      return normalized;
    }

    const created = await prisma.page.create({
      data: {
        slug: systemPage.slug,
        title: systemPage.title,
        template: "empty",
        content: getSystemPageDefaultContentBySlug(systemPage.slug),
        isPublished: true,
        images: [],
      },
      select: {
        id: true,
        slug: true,
        title: true,
        template: true,
        content: true,
        showHeader: true,
        showFooter: true,
        isPublished: true,
        updatedAt: true,
      },
    });

    return created;
  } catch (err) {
    if (isDbSyncError(err)) return null;
    throw err;
  }
}

                                                     
export async function getOrCreateFooterPage() {
  return getOrCreateSystemPage(SYSTEM_PAGE_CONFIG.footer.slug);
}

                                                      
export async function getOrCreateHomePage() {
  return getOrCreateSystemPage(SYSTEM_PAGE_CONFIG.home.slug);
}

                                                      
export async function getOrCreateConnectPage() {
  return getOrCreateSystemPage(SYSTEM_PAGE_CONFIG.connect.slug);
}

                                                       
export async function getOrCreateCatalogPage() {
  return getOrCreateSystemPage(SYSTEM_PAGE_CONFIG.catalog.slug);
}

function revalidatePublicPathBySlug(slug?: string | null) {
  if (!slug) return;

  revalidatePath(`/s/${slug}`);

  if (slug === "home") {
    revalidatePath("/");
  }

  if (slug === "courses") {
    revalidatePath("/courses");
  }

  if (slug === "lib") {
    revalidatePath("/lib");
    revalidatePath("/lib/articles");
    revalidatePath("/lib/articles/[slug]", "page");
  }

  if (slug === "connect") {
    revalidatePath("/connect");
  }

  if (slug === "contacts") {
    revalidatePath("/contacts");
  }

  if (slug === CATALOG_PAGE_SLUG) {
    revalidatePath("/psy-list");
  }

  if (slug === "site-footer") {
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/courses");
    revalidatePath("/connect");
    revalidatePath("/contacts");
    revalidatePath("/lib");
    revalidatePath("/lib/articles");
    revalidatePath("/lib/articles/[slug]", "page");
  }
}

function revalidatePageTargets(slug?: string | null, oldSlug?: string | null) {
  revalidatePath("/managers/pages");
  revalidatePath("/managers/pages/footer");
  revalidatePath("/managers/pages/home");
  revalidatePath("/managers/pages/connect");
  revalidatePath("/managers/pages/catalog");

  revalidatePublicPathBySlug(slug);

  if (oldSlug && oldSlug !== slug) {
    revalidatePublicPathBySlug(oldSlug);
  }
}

                                    
export async function getPageById(id: string) {
  if (!prisma) return null;
  try {
    const p = await prisma.page.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        title: true,
        template: true,
        content: true,
        images: true,
        showHeader: true,
        showFooter: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!p) return p;

    const systemPage = getSystemPageBySlug(p.slug);
    if (!systemPage) return p;

    const hasContent = Boolean(p.content?.trim());
    const needsNormalization =
      p.title !== systemPage.title ||
      p.template !== "empty" ||
      !p.isPublished ||
      !hasContent;

    if (!needsNormalization) return p;

    const normalized = await prisma.page.update({
      where: { id: p.id },
      data: {
        title: systemPage.title,
        template: "empty",
        isPublished: true,
        content: hasContent ? p.content : getSystemPageDefaultContentBySlug(systemPage.slug),
      },
      select: {
        id: true,
        slug: true,
        title: true,
        template: true,
        content: true,
        images: true,
        showHeader: true,
        showFooter: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return normalized;
  } catch (err) {
    if (isDbSyncError(err)) return null;
    throw err;
  }
}

                                                           
export async function createPage(formData: FormData) {
  if (!prisma) redirect("/managers/pages/new?error=db_unavailable");

  const title = (formData.get("title") as string)?.trim();
  const rawSlug = (formData.get("slug") as string)?.trim();
  const slug = rawSlug ? rawSlug.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "") : "";

  if (!slug) redirect("/managers/pages/new?error=fill_title_slug");

  const systemPage = getSystemPageBySlug(slug);
  if (!title && !systemPage) {
    redirect("/managers/pages/new?error=fill_title_slug");
  }

  const template = ((formData.get("template") as string)?.trim() === "empty" ? "empty" : "text") as "text" | "empty";
  const content = (formData.get("content") as string)?.trim() || "";
  const publishedVal = formData.getAll("isPublished");
  const isPublished = publishedVal[publishedVal.length - 1] === "on";
  const showHeaderVal = formData.getAll("showHeader");
  const showHeader = showHeaderVal[showHeaderVal.length - 1] === "on";
  const showFooterVal = formData.getAll("showFooter");
  const showFooter = showFooterVal[showFooterVal.length - 1] === "on";
  const images = formData.getAll("images").filter((v) => typeof v === "string" && v.startsWith("/pages/")) as string[];

  const normalizedSlug = systemPage ? systemPage.slug : slug;
  const normalizedTitle = systemPage ? systemPage.title : title!;
  const normalizedTemplate = systemPage ? "empty" : template;
  const normalizedContent = systemPage && !content ? getSystemPageDefaultContentBySlug(systemPage.slug) : content;
  const normalizedPublished = systemPage ? true : isPublished;

  try {
    await prisma.page.create({
      data: {
        title: normalizedTitle,
        slug: normalizedSlug,
        template: normalizedTemplate,
        content: normalizedContent,
        isPublished: normalizedPublished,
        showHeader,
        showFooter,
        images,
      },
    });
  } catch (err: unknown) {
    if (isDbSyncError(err)) redirect("/managers/pages?error=db_sync");
    const msg = err && typeof (err as { code?: string }).code === "string" ? (err as { code: string }).code : "";
    if (msg === "P2002") {
      redirect("/managers/pages/new?error=duplicate_slug&slug=" + encodeURIComponent(normalizedSlug));
    }
    redirect("/managers/pages/new?error=create_failed");
  }

  revalidatePageTargets(normalizedSlug);

  if (systemPage) {
    redirect(`${systemPage.managerPath}?saved=1`);
  }

  redirect("/managers/pages");
}

                                                                        
export async function updatePage(id: string, formData: FormData) {
  if (!prisma) redirect("/managers/pages?error=db_unavailable");

  const title = (formData.get("title") as string)?.trim();
  const rawSlug = (formData.get("slug") as string)?.trim();
  const slug = rawSlug ? rawSlug.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "") : "";
  const template = ((formData.get("template") as string)?.trim() === "empty" ? "empty" : "text") as "text" | "empty";
  const content = (formData.get("content") as string)?.trim() || "";
  const publishedVal = formData.getAll("isPublished");
  const isPublished = publishedVal[publishedVal.length - 1] === "on";
  const showHeaderVal = formData.getAll("showHeader");
  const showHeader = showHeaderVal[showHeaderVal.length - 1] === "on";
  const showFooterVal = formData.getAll("showFooter");
  const showFooter = showFooterVal[showFooterVal.length - 1] === "on";
  const images = formData.getAll("images").filter((v) => typeof v === "string" && v.startsWith("/pages/")) as string[];

  try {
    const old = await prisma.page.findUnique({ where: { id }, select: { slug: true } });
    if (!old) {
      redirect("/managers/pages?error=update_failed");
    }

    const oldSystemPage = getSystemPageBySlug(old.slug);
    const requestedSystemPage = getSystemPageBySlug(slug);
    const systemPage = oldSystemPage ?? requestedSystemPage;

    if ((!title || !slug) && !systemPage) {
      redirect(`/managers/pages/${id}/edit?error=fill_title_slug`);
    }

    const normalizedSlug = systemPage ? systemPage.slug : slug;
    const normalizedTitle = systemPage ? systemPage.title : title!;
    const normalizedTemplate = systemPage ? "empty" : template;
    const normalizedContent = systemPage && !content ? getSystemPageDefaultContentBySlug(systemPage.slug) : content;
    const normalizedPublished = systemPage ? true : isPublished;

    await prisma.page.update({
      where: { id },
      data: {
        title: normalizedTitle,
        slug: normalizedSlug,
        template: normalizedTemplate,
        content: normalizedContent,
        isPublished: normalizedPublished,
        showHeader,
        showFooter,
        images,
      },
    });

    revalidatePageTargets(normalizedSlug, old.slug);

    if (systemPage) {
      redirect(`${systemPage.managerPath}?saved=1`);
    }
  } catch (err: unknown) {
    if (isNextRedirectError(err)) throw err;
    if (isDbSyncError(err)) redirect("/managers/pages?error=db_sync");
    console.error("manager.pages.updatePage failed", { id, err });
    const code = err && typeof (err as { code?: string }).code === "string" ? (err as { code: string }).code : "";
    if (code === "P2002") redirect(`/managers/pages/${id}/edit?error=duplicate_slug`);
    redirect(`/managers/pages/${id}/edit?error=update_failed`);
  }

  redirect(`/managers/pages/${id}/edit?saved=1`);
}

                                                                          
export async function updateCatalogPageSections(formData: FormData) {
  if (!prisma) redirect("/managers/pages/catalog?error=db_unavailable");

  const topHtml = ((formData.get("topHtml") as string) || "").trim();
  const bottomHtml = ((formData.get("bottomHtml") as string) || "").trim();
  const page = await getOrCreateCatalogPage();

  if (!page) {
    redirect("/managers/pages/catalog?error=db_unavailable");
  }

  try {
    await prisma.page.update({
      where: { id: page.id },
      data: {
        slug: SYSTEM_PAGE_CONFIG.catalog.slug,
        title: SYSTEM_PAGE_CONFIG.catalog.title,
        template: "empty",
        isPublished: true,
        content: serializeCatalogPageSections({ topHtml, bottomHtml }),
      },
    });
  } catch (err: unknown) {
    if (isDbSyncError(err)) redirect("/managers/pages/catalog?error=db_sync");
    console.error("manager.pages.updateCatalogPageSections failed", { err });
    redirect("/managers/pages/catalog?error=update_failed");
  }

  revalidatePageTargets(SYSTEM_PAGE_CONFIG.catalog.slug);
  redirect("/managers/pages/catalog?saved=1");
}

                                                
export async function deletePage(id: string) {
  if (!prisma) redirect("/managers/pages?error=db_unavailable");
  try {
    const page = await prisma.page.findUnique({ where: { id }, select: { images: true, slug: true } });

    if (isSystemPageSlug(page?.slug)) {
      redirect("/managers/pages?error=system_page_protected");
    }

    if (page?.images && Array.isArray(page.images)) {
      for (const imgPath of page.images) {
        if (typeof imgPath === "string" && imgPath.startsWith("/pages/")) {
          const absPath = path.join(process.cwd(), "public", imgPath.replace(/^\/+/, ""));
          try {
            await fs.unlink(absPath);
          } catch {
                                                  
          }
        }
      }
    }

    await prisma.page.delete({ where: { id } });
    revalidatePageTargets(page?.slug);
  } catch (err: unknown) {
    if (isNextRedirectError(err)) throw err;
    if (isDbSyncError(err)) redirect("/managers/pages?error=db_sync");
    console.error("manager.pages.deletePage failed", { id, err });
    redirect("/managers/pages?error=delete_failed");
  }

  redirect("/managers/pages");
}
