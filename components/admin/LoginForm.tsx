"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("email", {
        email,
        redirect: false,
        callbackUrl: "/admin",
      });

      if (result?.error) {
        setError("Ошибка при отправке ссылки");
      } else {
        setIsSent(true);
      }
    } catch (error) {
      setError("Произошла ошибка");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="text-center p-6 bg-green-50 rounded-lg">
        <div className="text-green-600 text-lg mb-2">✓ Проверьте почту</div>
        <p className="text-gray-600">
          Мы отправили ссылку для входа на <strong>{email}</strong>
        </p>
      </div>
    );
  }

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
          placeholder="admin@example.com"
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