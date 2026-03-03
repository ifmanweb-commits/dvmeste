"use client";

import { useRouter } from "next/navigation";
import ArticleForm from "@/components/articles/ArticleForm";

interface Psychologist {
  id: string;
  fullName: string;
}

export default function ArticleNewClient({ psychologists }: { psychologists: Psychologist[] }) {
  const router = useRouter();

  async function handleSubmit(formData: any) {
    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Ошибка при создании");
      }
      
      router.refresh();
      router.push(`/admin/articles?created=${Date.now()}`);
    } catch (error) {
      console.error("Error creating article:", error);
      throw error;
    }
  }

  return <ArticleForm psychologists={psychologists} onSubmit={handleSubmit} />;
}