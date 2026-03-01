import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { getPageBySlug } from "@/lib/page-content";
import PageRenderer from "@/components/PageRenderer";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  
  if (!page) {
    return buildMetadata({
      title: slug,
      path: `/s/${slug}`,
    });
  }

  return buildMetadata({
    title: page.metaTitle || page.adminTitle || slug,
    description: page.metaDescription || undefined,
    path: `/s/${slug}`,
    keywords: page.metaKeywords || undefined,
    robots: page.metaRobots || undefined,
  });
}

export default async function PageBySlugRoute({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  
  if (!page || !page.isPublished) notFound();

  return <PageRenderer page={page} />;
}