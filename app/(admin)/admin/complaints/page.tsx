import { redirect } from "next/navigation";

export default async function ComplaintsPage() {
  redirect("/admin/complaints/clients");
}