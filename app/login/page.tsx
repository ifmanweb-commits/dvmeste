"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("email", {
        email,
        redirect: false,
        callbackUrl: "/account",
      });

      if (result?.error) {
        setError(result.error);
      } else {
        setSent(true);
      }
    } catch (err) {
      setError("Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl border border-neutral-200 p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Проверьте почту</h1>
          <p className="text-gray-600 mb-6">
            Мы отправили ссылку для входа на <strong>{email}</strong>
          </p>
          <p className="text-sm text-gray-500">
            Письмо должно прийти в течение минуты
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl border border-neutral-200 p-8">
        <h1 className="text-2xl font-bold mb-2">Вход в кабинет</h1>
        <p className="text-gray-600 mb-6">
          Введите email — мы отправим ссылку для входа
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
            {loading ? "Отправка..." : "Отправить ссылку"}
          </button>
        </form>
      </div>
    </div>
  );
}