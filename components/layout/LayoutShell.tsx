import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { ComplaintModalTrigger } from "@/components/complaint/ComplaintModalTrigger";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <ComplaintModalTrigger listenToComplaintLinks />
    </div>
  );
}
