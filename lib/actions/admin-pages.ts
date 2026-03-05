"use server";

import { revalidatePath } from "next/cache";
import { wrapCssWithClass } from "@/lib/css-modifier";
import { redirect } from "next/navigation";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { isDbSyncError } from "@/lib/db-error";
import { getSystemPageBySlug, isSystemPageSlug, SYSTEM_PAGE_CONFIG, SYSTEM_PAGE_SLUGS } from "@/lib/system-pages";
import { getSystemPageDefaultContentBySlug } from "@/lib/system-page-default-content";
import { CATALOG_PAGE_SLUG, serializeCatalogPageSections } from "@/lib/catalog-page-config";
import { requireAdmin } from '@/lib/auth/require';
import { isReservedSlug, makeSlugSafe } from '@/lib/constants/reserved-slugs';


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
  adminTitle: string;
  template: string;
  content: string;
  isPublished: boolean;
  updatedAt: Date;
};
export type ActionResult = 
  | { success: true }
  | { success: false; error: string };

                                                       
export async function getPagesList() {
  if (!prisma) return [];
  try {
    // Исключаем только те системные страницы, которые НЕ должны быть в списке
    const excludedSlugs = [
      SYSTEM_PAGE_CONFIG.footer.slug,  // футер оставляем в отдельном блоке
      // SYSTEM_PAGE_CONFIG.connect.slug, // connect теперь показываем в списке
      SYSTEM_PAGE_CONFIG.catalog.slug,  // каталог пока оставляем в отдельном блоке
    ];

    const list = await prisma.page.findMany({
      where: {
        slug: { notIn: excludedSlugs },
      },
      orderBy: { updatedAt: "desc" },
      select: { 
        id: true, 
        slug: true, 
        adminTitle: true, 
        template: true, 
        isPublished: true 
      },
    });
    return list;
  } catch (err) {
    if (isDbSyncError(err)) return [];
    throw err;
  }
}
// Получить все страницы (для списка)
export async function getPages() {
  await requireAdmin();
  
  try {
    const pages = await prisma.page.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        slug: true,
        adminTitle: true,
        template: true,
        isPublished: true,
        metaTitle: true,
        metaDescription: true,
        createdAt: true,
      },
    });
    
    return pages;
  } catch (error) {
    console.error('Error fetching pages:', error);
    return [];
  }
}

// Получить страницу по slug
export async function getPageBySlug(slug: string) {
  await requireAdmin();
  
  try {
    const page = await prisma.page.findUnique({
      where: { slug },
    });
    
    return page;
  } catch (error) {
    console.error('Error fetching page:', error);
    return null;
  }
}

export async function getPageById(id: string) {
  await requireAdmin();
  
  const page = await prisma.page.findUnique({
    where: { id },
  });
  
  return page;
}

// Создать новую страницу
export async function createPage(formData: any): Promise<ActionResult> {
  await requireAdmin();

  try {
    // Проверяем slug на зарезервированность
    let slug = formData.slug;
    if (isReservedSlug(slug)) {
      slug = makeSlugSafe(slug);
    }

    // Проверяем уникальность slug
    const existing = await prisma.page.findUnique({
      where: { slug },
    });

    if (existing) {
      return {
        success: false,
        error: 'Страница с таким адресом уже существует'
      };
    }

    // Создаём страницу в БД (получаем ID)
    const page = await prisma.page.create({
      data: {
        slug,
        adminTitle: formData.adminTitle,
        template: formData.template,
        content: formData.content,
        metaTitle: formData.metaTitle || null,
        metaDescription: formData.metaDescription || null,
        metaKeywords: formData.metaKeywords || null,
        metaRobots: formData.metaRobots || 'index, follow',
        customHead: formData.customHead || null,
        images: [], // пока пусто, заполним после переноса
        isPublished: formData.isPublished || false,
      },
    });

    // Переносим файлы из временной папки в постоянную по ID
    if (formData.tempKey) {
      await moveFiles(formData.tempKey, page.id);
      
      // Обновляем пути в images
      const updatedImages = (formData.images || []).map((img: string) => 
        img.replace(`pages/${formData.tempKey}`, `pages/${page.id}`)
      );
      
      // Обновляем страницу с правильными путями
      await prisma.page.update({
        where: { id: page.id },
        data: { images: updatedImages }
      });
    }

    revalidatePath('/admin/pages');
    revalidatePath('/', 'layout');
    
    return { success: true };
  } catch (error) {
    console.error('Error creating page:', error);
    
    let errorMessage = 'Ошибка при создании страницы';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}



// Обновить страницу
export async function updatePage(slug: string, formData: any): Promise<ActionResult> {
  await requireAdmin();

  try {
    // Проверяем, не меняется ли slug на зарезервированный
    let newSlug = formData.slug;
    if (isReservedSlug(newSlug)) {
      newSlug = makeSlugSafe(newSlug);
    }

    // Если slug меняется, проверяем уникальность
    if (newSlug !== slug) {
      const existing = await prisma.page.findUnique({
        where: { slug: newSlug },
      });

      if (existing) {
        return {
          success: false,
          error: 'Страница с таким адресом уже существует'
        };
      }
    }

    // Обновляем страницу
    await prisma.page.update({
      where: { slug },
      data: {
        slug: newSlug,
        adminTitle: formData.adminTitle,
        template: formData.template,
        content: formData.content,
        metaTitle: formData.metaTitle || null,
        metaDescription: formData.metaDescription || null,
        metaKeywords: formData.metaKeywords || null,
        metaRobots: formData.metaRobots || null,
        customHead: formData.customHead || null,
        images: formData.images || [],
        isPublished: formData.isPublished || false,
      },
    });

    // Очищаем кеш
    revalidatePath('/admin/pages');
    revalidatePath('/', 'layout');
    
    return { success: true };
  } catch (error) {
    console.error('Error updating page:', error);
    
    let errorMessage = 'Ошибка при сохранении';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

// Удалить страницу
export async function deletePage(id: string): Promise<ActionResult> {
  await requireAdmin();

  try {
    // Получаем страницу, чтобы узнать slug и файлы
    const page = await prisma.page.findUnique({
      where: { id },
      select: { 
        slug: true,
        images: true 
      }
    });

    if (!page) {
      return {
        success: false,
        error: 'Страница не найдена'
      };
    }

    // Удаляем файлы с диска
    if (page.images && page.images.length > 0) {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'pages', page.slug);
      
      try {
        await fs.rm(uploadsDir, { recursive: true, force: true });
        console.log(`🗑️ Удалена папка с файлами: ${uploadsDir}`);
      } catch (fileError) {
        console.error('Ошибка при удалении файлов:', fileError);
        // Продолжаем удаление страницы даже если файлы не удалились
      }
    }

    // Удаляем страницу из БД
    await prisma.page.delete({
      where: { id }
    });

    // Очищаем кеш
    revalidatePath('/admin/pages');
    revalidatePath('/', 'layout');
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting page:', error);
    
    let errorMessage = 'Ошибка при удалении страницы';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}
async function moveFiles(tempKey: string, finalKey: string) {
  const tempDir = path.join(process.cwd(), 'public', 'uploads', 'pages', tempKey);
  const finalDir = path.join(process.cwd(), 'public', 'uploads', 'pages', finalKey);
  
  try {
    // Проверяем, есть ли временная папка
    await fs.access(tempDir);
    
    // Создаём финальную папку
    await fs.mkdir(finalDir, { recursive: true });
    
    // Переносим файлы
    const files = await fs.readdir(tempDir);
    for (const file of files) {
      await fs.rename(
        path.join(tempDir, file),
        path.join(finalDir, file)
      );
    }
    
    // Удаляем временную папку
    await fs.rm(tempDir, { recursive: true });
  } catch (error) {
    // Временной папки нет - ничего не делаем
    console.log('No temp files to move');
  }
}
/*export async function getPages() {
  await requireAdmin();
  
  try {
    const pages = await prisma.page.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        slug: true,
        adminTitle: true,
        template: true,
        isPublished: true,
        metaTitle: true,
        metaDescription: true,
        createdAt: true,
      },
    });
    
    return pages;
  } catch (error) {
    console.error('Error fetching pages:', error);
    return [];
  }
}*/

async function getOrCreateSystemPage(systemSlug: string): Promise<SystemPageRecord | null> {
  const systemPage = getSystemPageBySlug(systemSlug);
  if (!prisma || !systemPage) return null;

  try {
    const found = await prisma.page.findUnique({
      where: { slug: systemPage.slug },
      select: {
        id: true,
        slug: true,
        adminTitle: true,
        template: true,
        content: true,
        isPublished: true,
        updatedAt: true,
      },
    });

    if (found) {
      const hasContent = Boolean(found.content?.trim());
      const needsDefaultContent = !hasContent;
      const needsNormalization =
        found.adminTitle !== systemPage.title ||
        found.template !== "empty" ||
        !found.isPublished ||
        needsDefaultContent;

      if (!needsNormalization) return found;

      const normalized = await prisma.page.update({
        where: { id: found.id },
        data: {
          adminTitle: systemPage.title,
          template: "empty",
          isPublished: true,
          content: hasContent ? found.content : getSystemPageDefaultContentBySlug(systemPage.slug),
        },
        select: {
          id: true,
          slug: true,
          adminTitle: true,
          template: true,
          content: true,
          isPublished: true,
          updatedAt: true,
        },
      });

      return normalized;
    }

    const created = await prisma.page.create({
      data: {
        slug: systemPage.slug,
        adminTitle: systemPage.title,
        template: "empty",
        content: getSystemPageDefaultContentBySlug(systemPage.slug),
        isPublished: true,
        images: [],
      },
      select: {
        id: true,
        slug: true,
        adminTitle: true,
        template: true,
        content: true,
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

                                                      


                                                       
export async function getOrCreateCatalogPage() {
  return getOrCreateSystemPage(SYSTEM_PAGE_CONFIG.catalog.slug);
}

function revalidatePublicPathBySlug(slug?: string | null) {
  if (!slug) return;

  revalidatePath(`/s/${slug}`);

  if (slug === "home") {
    revalidatePath("/");
  }


//  if (slug === "connect") {
//    revalidatePath("/connect");
//  }


  if (slug === CATALOG_PAGE_SLUG) {
    revalidatePath("/psy-list");
  }

  if (slug === "site-footer") {
    revalidatePath("/", "layout");
    revalidatePath("/");
  }
}

function revalidatePageTargets(slug?: string | null, oldSlug?: string | null) {
  revalidatePath("/admin/pages");
  revalidatePath("/admin/pages/footer");
  revalidatePath("/admin/pages/home");
  revalidatePath("/admin/pages/connect");
  revalidatePath("/admin/pages/catalog");

  revalidatePublicPathBySlug(slug);

  if (oldSlug && oldSlug !== slug) {
    revalidatePublicPathBySlug(oldSlug);
  }
}

/*                                    
export async function getPageById(id: string) {
  if (!prisma) return null;
  try {
    const p = await prisma.page.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        adminTitle: true,        // новое
        metaTitle: true,         // новое
        metaDescription: true,   // новое
        metaKeywords: true,      // новое
        metaRobots: true,        // новое
        template: true,
        content: true,
        customHead: true,        // новое
        images: true,
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
      p.adminTitle !== systemPage.title ||
      p.template !== "empty" ||
      !p.isPublished ||
      !hasContent;

    if (!needsNormalization) return p;

    const normalized = await prisma.page.update({
      where: { id: p.id },
      data: {
        adminTitle: systemPage.title,
        template: "empty",
        isPublished: true,
        content: hasContent ? p.content : getSystemPageDefaultContentBySlug(systemPage.slug),
      },
      select: {
        id: true,
        slug: true,
        adminTitle: true,
        template: true,
        content: true,
        images: true,
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
*/
                                                           
/*export async function createPage(formData: FormData) {
  if (!prisma) redirect("/admin/pages/new?error=db_unavailable");

  const title = (formData.get("title") as string)?.trim();
  const rawSlug = (formData.get("slug") as string)?.trim();
  const slug = rawSlug ? rawSlug.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "") : "";

  if (!slug) redirect("/admin/pages/new?error=fill_title_slug");

  const systemPage = getSystemPageBySlug(slug);
  if (!title && !systemPage) {
    redirect("/admin/pages/new?error=fill_title_slug");
  }

  const template = ((formData.get("template") as string)?.trim() === "empty" ? "empty" : "text") as "text" | "empty";
  const content = (formData.get("content") as string)?.trim() || "";
  const publishedVal = formData.getAll("isPublished");
  const isPublished = publishedVal[publishedVal.length - 1] === "on";
  const images = formData.getAll("images").filter((v) => typeof v === "string" && v.startsWith("/pages/")) as string[];

  const normalizedSlug = systemPage ? systemPage.slug : slug;
  const normalizedTitle = systemPage ? systemPage.title : title!;
  const normalizedTemplate = systemPage ? "empty" : template;
  const normalizedContent = systemPage && !content ? getSystemPageDefaultContentBySlug(systemPage.slug) : content;
  const normalizedPublished = systemPage ? true : isPublished;

  try {
    await prisma.page.create({
      data: {
        adminTitle: normalizedTitle,
        slug: normalizedSlug,
        template: normalizedTemplate,
        content: normalizedContent,
        isPublished: normalizedPublished,
        images,
      },
    });
  } catch (err: unknown) {
    if (isDbSyncError(err)) redirect("/admin/pages?error=db_sync");
    const msg = err && typeof (err as { code?: string }).code === "string" ? (err as { code: string }).code : "";
    if (msg === "P2002") {
      redirect("/admin/pages/new?error=duplicate_slug&slug=" + encodeURIComponent(normalizedSlug));
    }
    redirect("/admin/pages/new?error=create_failed");
  }

  revalidatePageTargets(normalizedSlug);

  if (systemPage) {
    redirect(`${systemPage.adminPath}?saved=1`);
  }

  redirect("/admin/pages");
}*/

/*                                                          
export async function updatePage(id: string, formData: FormData) {
  if (!prisma) redirect("/admin/pages?error=db_unavailable");

  const title = (formData.get("adminTitle") as string)?.trim();
  const rawSlug = (formData.get("slug") as string)?.trim();
  const slug = rawSlug ? rawSlug.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "") : "";
  const template = formData.get("template") as string;
  const content = (formData.get("content") as string)?.trim() || "";
  const publishedVal = formData.getAll("isPublished");
  const isPublished = publishedVal[publishedVal.length - 1] === "on";
  const images = formData.getAll("images").filter((v) => typeof v === "string" && v.startsWith("/pages/")) as string[];
  const metaTitle = (formData.get("metaTitle") as string)?.trim() || null;
  const metaDescription = (formData.get("metaDescription") as string)?.trim() || null;
  const metaKeywords = (formData.get("metaKeywords") as string)?.trim() || null;
  const metaRobots = (formData.get("metaRobots") as string)?.trim() || null;
  const customHead = (formData.get("customHead") as string)?.trim() || null;

  try {
    const old = await prisma.page.findUnique({ where: { id }, select: { slug: true } });
    if (!old) {
      redirect("/admin/pages?error=update_failed");
    }

    const oldSystemPage = getSystemPageBySlug(old.slug);
    const requestedSystemPage = getSystemPageBySlug(slug);

    // Проверка обязательных полей
    const systemPage = getSystemPageBySlug(slug) || getSystemPageBySlug(old?.slug);
    const isSystem = Boolean(systemPage);

    if (!isSystem) {
      const title = formData.get("adminTitle") as string;
      if (!title?.trim() || !slug?.trim()) {
        redirect(`/admin/pages/${id}/edit?error=fill_title_slug`);
      }
    }

    const normalizedSlug = systemPage ? systemPage.slug : slug;
    const normalizedTitle = systemPage ? systemPage.title : title!;
    const normalizedTemplate = systemPage ? "empty" : template;
    const normalizedContent = systemPage && !content ? getSystemPageDefaultContentBySlug(systemPage.slug) : content;
    const normalizedPublished = systemPage ? true : isPublished;
    // Генерируем уникальный класс для страницы
    const pageClass = `page-${id.replace(/[^a-zA-Z0-9-]/g, '')}`;

    // Если шаблон landing или blank — оборачиваем контент
    let processedContent = content;
    if (template === 'landing' || template === 'blank') {
      // Проверяем, есть ли уже обёртка с этим классом
      if (!normalizedContent.includes(`class="${pageClass}"`)) {
        processedContent = `<div class="${pageClass}">${normalizedContent}</div>`;
      }
    }

    let processedCustomHead = customHead;
    if ((template === 'landing' || template === 'blank') && customHead) {
      // Ищем блоки <style> в customHead
      const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
      processedCustomHead = customHead.replace(styleRegex, (match, cssContent) => {
        const wrappedCss = wrapCssWithClass(cssContent, pageClass);
        return match.replace(cssContent, wrappedCss);
      });
    }

    await prisma.page.update({
      where: { id },
      data: {
        adminTitle: normalizedTitle,
        slug: normalizedSlug,
        template: normalizedTemplate,
        content: processedContent,
        metaTitle,
        metaDescription,
        metaKeywords,
        metaRobots,
        customHead: processedCustomHead,
        isPublished: normalizedPublished,
        images,
      },
    });

    revalidatePageTargets(normalizedSlug, old.slug);

    if (systemPage) {
      redirect(`${systemPage.adminPath}?saved=1`);
    }
  } catch (err: unknown) {
    if (isNextRedirectError(err)) throw err;
    if (isDbSyncError(err)) redirect("/admin/pages?error=db_sync");
    console.error("admin.pages.updatePage failed", { id, err });
    const code = err && typeof (err as { code?: string }).code === "string" ? (err as { code: string }).code : "";
    if (code === "P2002") redirect(`/admin/pages/${id}/edit?error=duplicate_slug`);
    redirect(`/admin/pages/${id}/edit?error=update_failed`);
  }

  redirect(`/admin/pages/${id}/edit?saved=1`);
}
*/
                                                                          
export async function updateCatalogPageSections(formData: FormData) {
  if (!prisma) redirect("/admin/pages/catalog?error=db_unavailable");

  const topHtml = ((formData.get("topHtml") as string) || "").trim();
  const bottomHtml = ((formData.get("bottomHtml") as string) || "").trim();
  const page = await getOrCreateCatalogPage();

  if (!page) {
    redirect("/admin/pages/catalog?error=db_unavailable");
  }

  try {
    await prisma.page.update({
      where: { id: page.id },
      data: {
        slug: SYSTEM_PAGE_CONFIG.catalog.slug,
        adminTitle: SYSTEM_PAGE_CONFIG.catalog.title,
        template: "empty",
        isPublished: true,
        content: serializeCatalogPageSections({ topHtml, bottomHtml }),
      },
    });
  } catch (err: unknown) {
    if (isDbSyncError(err)) redirect("/admin/pages/catalog?error=db_sync");
    console.error("admin.pages.updateCatalogPageSections failed", { err });
    redirect("/admin/pages/catalog?error=update_failed");
  }

  revalidatePageTargets(SYSTEM_PAGE_CONFIG.catalog.slug);
  redirect("/admin/pages/catalog?saved=1");
}

/*                                             
export async function deletePage(id: string) {
  if (!prisma) redirect("/admin/pages?error=db_unavailable");
  try {
    const page = await prisma.page.findUnique({ where: { id }, select: { images: true, slug: true } });

    if (isSystemPageSlug(page?.slug)) {
      redirect("/admin/pages?error=system_page_protected");
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
    if (isDbSyncError(err)) redirect("/admin/pages?error=db_sync");
    console.error("admin.pages.deletePage failed", { id, err });
    redirect("/admin/pages?error=delete_failed");
  }

  redirect("/admin/pages");
}*/
