import { buildMetadata } from "@/lib/seo";
import { getPageBySlug } from "@/lib/page-content";
import PageRenderer from "@/components/PageRenderer";
import { HomeFallback } from "@/components/pages/HomeFallback";

export async function generateMetadata() {
  const page = await getPageBySlug("home");
  
  return {
    title: page?.metaTitle || page?.adminTitle || "Давай вместе",
    description: page?.metaDescription || "Реестр психологов с прозрачной сертификацией",
  };
}

export default async function HomePage() {
  const page = await getPageBySlug("home");
  
  // Проверяем, есть ли контент и опубликована ли страница
  const hasContent = Boolean(page?.content?.trim());
  const isPublished = page?.isPublished;

  if (page && hasContent && isPublished) {
    return <PageRenderer page={page} />;
  }

  return <HomeFallback />;
}