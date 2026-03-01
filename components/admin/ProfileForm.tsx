"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProfileFormProps {
  admin: {
    id: string;
    email: string;
    fullName: string | null;
    role: string;
  };
}

export function ProfileForm({ admin }: ProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    fullName: admin.fullName || "",
    email: admin.email,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Ошибка при сохранении");
      }

      router.push("/admin/profile?saved=1");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">Основные данные</h2>
      <p className="mt-1 text-sm text-neutral-dark">
        Измените имя или email для входа.
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4 grid gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground">
            Имя
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-foreground focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20 outline-none transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-foreground focus:border-[#5858E2] focus:ring-2 focus:ring-[#5858E2]/20 outline-none transition"
          />
          <p className="mt-1 text-xs text-gray-500">
            На этот email будут приходить ссылки для входа
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="mt-6 w-full rounded-xl bg-[#5858E2] py-2.5 font-medium text-white hover:bg-[#4848d0] transition-colors disabled:opacity-50"
      >
        {isLoading ? "Сохранение..." : "Сохранить изменения"}
      </button>
    </form>
  );
}