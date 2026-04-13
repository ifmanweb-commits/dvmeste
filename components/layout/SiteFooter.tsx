import BlockRenderer from "@/components/BlockRenderer";

export async function SiteFooter() {
  return (
    <footer id="site-footer" className="border-t border-neutral-200/50 bg-white">
      <BlockRenderer slugs={['global-footer']} variant="body" />
    </footer>
  );
}