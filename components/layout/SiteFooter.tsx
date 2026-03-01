import { getPageBySlug } from "@/lib/page-content";
import { applyFooterTokens, FOOTER_DEFAULT_CONTENT, FOOTER_PAGE_SLUG } from "@/lib/footer-config";
import { normalizeEmbeddedLocalAssetUrls } from "@/lib/html-local-assets";

export async function SiteFooter() {
  const managedFooter = await getPageBySlug(FOOTER_PAGE_SLUG);
  const html = normalizeEmbeddedLocalAssetUrls(applyFooterTokens(managedFooter?.content || FOOTER_DEFAULT_CONTENT));

  return (
    <footer id="site-footer" className="border-t border-neutral-200/50 bg-white">
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </footer>
  );
}
