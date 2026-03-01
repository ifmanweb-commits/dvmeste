import { getPageBySlug } from "@/lib/page-content";
import { buildMetadata } from "@/lib/seo";
import { PageContent } from "@/components/PageContent";
import { ConnectFallback } from "@/components/pages/ConnectFallback";

export const metadata = buildMetadata({
  title: "Для психологов — Давай вместе",
  description:
    "Почему выгодно быть в реестре, как попасть, уровни сертификации. Информация для специалистов. Сервис «Давай вместе».",
  path: "/connect",
});

export default async function ConnectPage() {
  const page = await getPageBySlug("connect");
  const hasCustomContent = Boolean(page?.content?.trim());

  if (page && hasCustomContent) {
    return <PageContent title={page.title} template={page.template} content={page.content} />;
  }

  return <ConnectFallback />;
}
