import { redirect } from "next/navigation";
import { getOrCreateConnectPage } from "@/lib/actions/manager-pages";

export default async function ManagersConnectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [page, params] = await Promise.all([getOrCreateConnectPage(), searchParams]);
  if (!page) {
    redirect("/managers/pages?error=db_unavailable");
  }

  const qs = new URLSearchParams({ connect: "1" });
  if (params.saved === "1") qs.set("saved", "1");
  if (typeof params.error === "string") qs.set("error", params.error);

  redirect(`/managers/pages/${page.id}/edit?${qs.toString()}`);
}
