import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isDbSyncError } from "@/lib/db-error";
import { FOOTER_PAGE_SLUG } from "@/lib/footer-config";

export default async function AdminFooterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  let page: { id: string } | null = null;
  
  try {
    page = await prisma?.page.findUnique({
      where: { slug: FOOTER_PAGE_SLUG },
      select: { id: true },
    }) || null;
  } catch (err) {
    if (!isDbSyncError(err)) {
      console.error("Error fetching footer page:", err);
    }
  }
  
  if (!page) {
    redirect("/admin/pages?error=footer_not_found");
  }

  const params = await searchParams;
  const qs = new URLSearchParams({ footer: "1" });
  if (params.saved === "1") qs.set("saved", "1");
  if (typeof params.error === "string") qs.set("error", params.error);

  redirect(`/admin/pages/${page.id}/edit?${qs.toString()}`);
}
