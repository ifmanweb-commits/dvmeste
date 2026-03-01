"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function MagicLinkForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Сначала проверим роль пользователя на сервере
      const checkRes = await fetch(`/api/user-role?email=${encodeURIComponent(email)}`);
      const { role } = await checkRes.json();
      
      // Определяем callbackUrl в зависимости от роли
      let callbackUrl = "/";
      if (role === 'ADMIN' || role === 'MANAGER') {
        callbackUrl = "/admin";
      } else if (role === 'USER') {
        callbackUrl = "/account";
      }

      const result = await signIn("email", {
        email,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError("Ошибка при отправке ссылки");
      } else {
        router.push("/auth/login?sent=1");
      }
    } catch (error) {
      setError("Произошла ошибка");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#5858E2]/20 focus:border-[#5858E2] outline-none"
          placeholder="ivan@example.com"
          disabled={isLoading}
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#5858E2] text-white py-2 rounded-lg hover:bg-[#4747b5] transition-colors disabled:opacity-50"
      >
        {isLoading ? "Отправка..." : "Получить ссылку для входа"}
      </button>
    </form>
  );
}