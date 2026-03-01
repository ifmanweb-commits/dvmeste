import { getPsychologists } from "@/app/actions/catalog";
import { CatalogWithModal } from "@/components/catalog/CatalogWithModal";
import { buildMetadata } from "@/lib/seo";
import { CATALOG_PAGE_SIZE } from "@/constants/catalog";
import { searchParamsToFilters, searchParamsToPagination } from "@/app/catalog/params";
import { MobileFilters } from "@/components/catalog/MobileFilters";
import { CatalogSidebar } from "@/components/catalog/CatalogSidebar";
import { getPageBySlug } from "@/lib/page-content";
import { CATALOG_PAGE_SLUG, parseCatalogPageSections } from "@/lib/catalog-page-config";
import { Filter } from "lucide-react";
import { normalizeEmbeddedLocalAssetUrls } from "@/lib/html-local-assets";

export const revalidate = 60;

export const metadata = buildMetadata({
  title: "Каталог психологов — Давай вместе",
  description: "Найдите проверенного психолога по специализации, цене и опыту.",
  path: "/psy-list",
});

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PsyListPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = searchParamsToFilters(params);
  const pagination = searchParamsToPagination(params);

  const [{ items, nextCursor, hasMore }, catalogPage] = await Promise.all([
    getPsychologists(filters, {
      ...pagination,
      limit: CATALOG_PAGE_SIZE,
    }),
    getPageBySlug(CATALOG_PAGE_SLUG),
  ]);
  const { topHtml, bottomHtml } = parseCatalogPageSections(catalogPage?.content);
  const normalizedTopHtml = normalizeEmbeddedLocalAssetUrls(topHtml || "");
  const normalizedBottomHtml = normalizeEmbeddedLocalAssetUrls(bottomHtml || "");
  const hasTopHtml = Boolean(normalizedTopHtml);
  const hasBottomHtml = Boolean(normalizedBottomHtml);

  return (
    <div className="min-h-screen bg-white">
      {hasTopHtml ? (
        <div
          className="w-full [&_iframe]:max-w-full [&_img]:h-auto [&_img]:max-w-full [&_video]:max-w-full"
          dangerouslySetInnerHTML={{ __html: normalizedTopHtml }}
        />
      ) : (
        <section className="border-b border-neutral-200 bg-[#f5f5f7]">
          <div className="mx-auto w-full max-w-[1420px] px-4 pb-14 pt-16 sm:px-6 sm:pb-20 sm:pt-24">
            <div className="mx-auto flex max-w-sm items-center justify-center gap-5 sm:max-w-md sm:gap-8">
              <span className="h-px flex-1 bg-[#68b417]" />
              <p className="text-sm font-medium tracking-[0.24em] text-[#5858E2] sm:text-base">КАТАЛОГ</p>
              <span className="h-px flex-1 bg-[#5858E2]" />
            </div>

            <h1 className="mt-8 text-center text-5xl font-extrabold leading-[1.02] text-[#111a33] sm:mt-10 sm:text-6xl lg:text-8xl">
              Найдите <span className="text-[#5858E2]">психолога</span>
            </h1>

            <div className="mx-auto mt-5 h-2 w-32 rounded-full bg-gradient-to-r from-[#5858E2] via-[#8b8df0] to-[#7bc143] sm:w-48" />

            <p className="mx-auto mt-9 max-w-5xl text-center text-xl leading-relaxed text-[#3d4a5f] sm:text-3xl">
              Только специалисты, прошедшие наши экзамены и доказавшие свою квалификацию.
            </p>
            <p className="mx-auto mt-9 max-w-5xl text-center text-xl leading-relaxed text-[#3d4a5f] sm:text-3xl">
              <a href=""></a>
            </p>

            <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 text-center sm:mt-16 sm:grid-cols-3 sm:gap-8">
              <div>
                <p className="text-4xl font-extrabold text-[#60a60f] sm:text-5xl">2+</p>
                <p className="mt-2 text-lg text-[#4d596b] sm:text-2xl">специалистов</p>
              </div>
              <div>
                <p className="text-4xl font-extrabold text-[#5858E2] sm:text-5xl">3</p>
                <p className="mt-2 text-lg text-[#4d596b] sm:text-2xl">уровня</p>
              </div>
              <div>
                <p className="text-4xl font-extrabold text-[#111a33] sm:text-5xl">50+</p>
                <p className="mt-2 text-lg text-[#4d596b] sm:text-2xl">направлений</p>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="relative">
        <div className="mx-auto w-full max-w-[1640px] px-4 py-8 sm:px-6 xl:px-8">

          {                          }
          <div className="mb-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">Результаты поиска</div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-gray-900">{items.length}</div>
                  <div className="h-4 w-px bg-gray-300"></div>
                  <div className="text-sm text-gray-600">психологов найдено</div>
                </div>
              </div>

              {                                                           }
              <div className="text-xs text-[#5858E2] font-medium flex items-center gap-1 sm:hidden">
                <Filter className="w-3 h-3" />
                Фильтры • Сортировка
              </div>
            </div>
          </div>

          {                        }
          <div className="relative">
            {                                       }
            <MobileFilters initialParams={params} />
            
            <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
              {                                                      }
              <div className="hidden lg:block w-[300px] shrink-0">
                <div id="list" className="sticky top-6">
                  <CatalogSidebar initialParams={params} />
                </div>
              </div>
            
              
              {                      }
              <div className="flex-1">
                <CatalogWithModal
                  items={items}
                  nextCursor={nextCursor}
                  hasMore={hasMore ?? false}
                  searchParams={params}
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
