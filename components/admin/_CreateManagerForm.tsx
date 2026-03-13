"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateManagerForm() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    role: "MANAGER" as "MANAGER" | "ADMIN",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/managers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ошибка при создании");
      }

      setFormData({ email: "", fullName: "", role: "MANAGER" });
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-[#5858E2] text-white px-4 py-2 rounded-lg hover:bg-[#4747b5] transition-colors"
      >
        + Добавить менеджера
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6">
      <h2 className="text-lg font-semibold mb-4">Новый менеджер</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">
            Имя *
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
            className="w-full p-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#5858E2]/20 focus:border-[#5858E2] outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="w-full p-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#5858E2]/20 focus:border-[#5858E2] outline-none"
          />
          <p className="mt-1 text-xs text-gray-500">
            На этот email придёт ссылка для входа
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Роль *
          </label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as "MANAGER" | "ADMIN" })}
            className="w-full p-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#5858E2]/20 focus:border-[#5858E2] outline-none"
          >
            <option value="MANAGER">Менеджер</option>
            <option value="ADMIN">Администратор</option>
          </select>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-[#5858E2] text-white px-4 py-2 rounded-lg hover:bg-[#4747b5] transition-colors disabled:opacity-50"
          >
            {isLoading ? "Создание..." : "Создать"}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex-1 border border-neutral-200 px-4 py-2 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}