"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { markLeadAsSuspicious, shadowBanClient } from "@/lib/actions/leads";

export function SuspiciousButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!confirm("Пометить заявку как подозрительную?")) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.append("leadId", leadId);
      await markLeadAsSuspicious(formData);
      router.refresh();
    });
  };

  return (
    <button
      onClick={handleSubmit}
      disabled={pending}
      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
    >
      {pending ? "..." : "Пометить подозрительным"}
    </button>
  );
}

export function ShadowBanButton({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!confirm("Установить теневой бан клиенту? Это действие нельзя отменить из этого интерфейса.")) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.append("clientId", clientId);
      await shadowBanClient(formData);
      router.refresh();
    });
  };

  return (
    <button
      onClick={handleSubmit}
      disabled={pending}
      className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors disabled:opacity-50"
    >
      {pending ? "..." : "Теневой бан клиента"}
    </button>
  );
}