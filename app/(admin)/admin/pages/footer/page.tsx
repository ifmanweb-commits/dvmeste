import { redirect } from "next/navigation";
import { getOrCreateFooterPage } from "@/lib/actions/admin-pages";

export default async function AdminFooterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [page, params] = await Promise.all([getOrCreateFooterPage(), searchParams]);
  if (!page) {
    redirect("/admin/pages?error=db_unavailable");
  }

  const qs = new URLSearchParams({ footer: "1" });
  if (params.saved === "1") qs.set("saved", "1");
  if (typeof params.error === "string") qs.set("error", params.error);

  redirect(`/admin/pages/${page.id}/edit?${qs.toString()}`);
}
