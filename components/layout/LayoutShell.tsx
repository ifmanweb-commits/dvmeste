import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { ComplaintModalTrigger } from "@/components/complaint/ComplaintModalTrigger";
import BlockRenderer from "@/components/BlockRenderer";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      
      {/* Глобальный header-блок (стики-блок сверху) */}
      <BlockRenderer slugs={['global-header']} variant="body" />
      
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <ComplaintModalTrigger listenToComplaintLinks />
    </div>
  );
}
