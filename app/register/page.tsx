"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email"),
      password: formData.get("password"),
      fullName: formData.get("fullName"),
    };

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Ошибка регистрации");
      }

      router.push("/account?registered=1");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl border border-neutral-200 p-8">
        <h1 className="text-2xl font-bold mb-2">Регистрация психолога</h1>
        <p className="text-gray-600 mb-6">Присоединяйтесь к каталогу «Давай вместе»</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Имя и фамилия</label>
            <input
              type="text"
              name="fullName"
              required
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#5858E2]/20 focus:border-[#5858E2] outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#5858E2]/20 focus:border-[#5858E2] outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Пароль</label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#5858E2]/20 focus:border-[#5858E2] outline-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#5858E2] text-white py-2 rounded-lg hover:bg-[#4747b5] disabled:opacity-50 transition-colors"
          >
            {loading ? "Регистрация..." : "Зарегистрироваться"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-[#5858E2] hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}