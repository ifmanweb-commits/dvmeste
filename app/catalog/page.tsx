import { getPsychologists } from "@/lib/actions/client-catalog";
import { CatalogWithModal } from "@/components/catalog/CatalogWithModal";
import { buildMetadata } from "@/lib/seo";
import { CATALOG_PAGE_SIZE } from "@/constants/catalog";
import { searchParamsToFilters, searchParamsToPagination } from "@/lib/catalog-params";
import { MobileFilters } from "@/components/catalog/MobileFilters";
import { CatalogSidebar } from "@/components/catalog/CatalogSidebar";
import { getPageBySlug } from "@/lib/page-content";
import { CATALOG_PAGE_SLUG, parseCatalogPageSections } from "@/lib/catalog-page-config";
import { prisma } from "@/lib/prisma";
import { normalizeEmbeddedLocalAssetUrls } from "@/lib/html-local-assets";
import { getSession } from "@/lib/auth/session";
import type { PsychologistCatalogItem } from "@/types/catalog";

export const revalidate = 60;
export const dynamic = 'force-dynamic'

export const metadata = buildMetadata({
  title: "Каталог психологов — Давай вместе",
  description: "Найдите проверенного психолога по специализации, цене и опыту.",
  path: "/catalog",
});

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
const catalogHeader = await prisma.blocks.findUnique({
  where: { slug: "catalog-header", isActive: true },
  select: { content: true }
});
export default async function PsyListPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = searchParamsToFilters(params);
  const pagination = searchParamsToPagination(params);

  // Получаем текущего пользователя
  const session = await getSession();
  const currentUser = session?.user;

  // Проверяем, является ли текущий пользователь психологом с опубликованной анкетой
  let currentUserProfile: PsychologistCatalogItem | null = null;
  let excludeUserId: string | undefined;

  if (currentUser?.isPublished && currentUser.status === "ACTIVE") {
    excludeUserId = currentUser.id;
    // Получаем данные профиля текущего пользователя
    const userProfile = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        slug: true,
        fullName: true,
        gender: true,
        birthDate: true,
        city: true,
        workFormat: true,
        mainParadigm: true,
        certificationLevel: true,
        shortBio: true,
        price: true,
        freeSession: true,
        avatarUrl: true,
      },
    });

    if (userProfile) {
      // Получаем проверенные фото
      const photos = await prisma.document.findMany({
        where: {
          userId: currentUser.id,
          type: "PHOTO",
          verifiedAt: { not: null },
        },
        select: { url: true },
        orderBy: { uploadedAt: "asc" },
        take: 1,
      });

      const hasVerifiedAvatar = userProfile.avatarUrl && photos.some(p => p.url === userProfile.avatarUrl);
      const previewImage = hasVerifiedAvatar ? userProfile.avatarUrl : (photos[0]?.url ?? null);

      // Получаем статистику образования
      const educationStats = await prisma.document.groupBy({
        by: ['userId', 'type'],
        where: {
          userId: currentUser.id,
          type: { in: ["ACADEMIC_EDUCATION", "PROFESSIONAL_TRAINING", "COURSE"] },
          verifiedAt: { not: null },
        },
        _count: true,
      });

      const stats = educationStats.reduce((acc, stat) => {
        if (!acc[stat.userId]) acc[stat.userId] = { diplomas: 0, courses: 0 };
        if (stat.type === "ACADEMIC_EDUCATION") {
          acc[stat.userId].diplomas += stat._count;
        } else {
          acc[stat.userId].courses += stat._count;
        }
        return acc;
      }, {} as Record<string, { diplomas: number; courses: number }>);

      currentUserProfile = {
        id: userProfile.id,
        slug: userProfile.slug || '',
        fullName: userProfile.fullName || 'Без имени',
        gender: userProfile.gender || '',
        birthDate: userProfile.birthDate,
        city: userProfile.city || '',
        workFormat: userProfile.workFormat || "",
        mainParadigm: userProfile.mainParadigm || [],
        certificationLevel: userProfile.certificationLevel,
        shortBio: userProfile.shortBio || "",
        price: userProfile.price,
        freeSession: userProfile.freeSession ?? 0,
        images: previewImage ? [previewImage] : [],
        educationCount: stats[userProfile.id]?.diplomas || 0,
        coursesCount: stats[userProfile.id]?.courses || 0,
      };
    }
  }

  const [{ items, nextCursor, hasMore }, catalogPage] = await Promise.all([
    getPsychologists(filters, {
      ...pagination,
      limit: CATALOG_PAGE_SIZE,
    }, excludeUserId),
    getPageBySlug(CATALOG_PAGE_SLUG),
  ]);
  const { topHtml, bottomHtml } = parseCatalogPageSections(catalogPage?.content);
  const normalizedTopHtml = normalizeEmbeddedLocalAssetUrls(topHtml || "");
  const normalizedBottomHtml = normalizeEmbeddedLocalAssetUrls(bottomHtml || "");
  const hasBottomHtml = Boolean(normalizedBottomHtml);

  return (
    <div className="min-h-screen bg-white">
      {catalogHeader?.content && (
        <div 
          className="w-full [&_iframe]:max-w-full [&_img]:h-auto [&_img]:max-w-full [&_video]:max-w-full"
          dangerouslySetInnerHTML={{ __html: catalogHeader.content }}
        />
      )}

      <div className="relative">
        <div className="mx-auto w-full max-w-[1640px] px-4 py-8 sm:px-6 xl:px-8">
          <div className="relative">
            <MobileFilters initialParams={params} totalCount={items.length} />
            
            <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
              <div className="hidden lg:block w-[300px] shrink-0">
                <div id="list" className="sticky top-6">
                  <CatalogSidebar initialParams={params} totalCount={items.length} />
                </div>
              </div>
              
      <div className="flex-1">
        <CatalogWithModal
          items={items}
          nextCursor={nextCursor}
          hasMore={hasMore ?? false}
          searchParams={params}
          currentUserProfile={currentUserProfile}
        />
      </div>
            </div>
          </div>

          {hasBottomHtml && (
            <div
              className="mt-12 w-full [&_iframe]:max-w-full [&_img]:h-auto [&_img]:max-w-full [&_video]:max-w-full"
              dangerouslySetInnerHTML={{ __html: normalizedBottomHtml }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
